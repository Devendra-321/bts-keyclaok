"use strict";

const fs = require("fs");
const _ = require("lodash");
const XLSX = require("xlsx");
const path = require("path");
const config = require("config");
const async = require("async");
const { Readable } = require("stream");
const streamifier = require("streamifier");
const cloudinary = require("cloudinary").v2;
const { ObjectId } = require("mongoose").Types;
const { uploadS3 } = require("../helpers/AWSHelper");
const { FoodType } = require("../models");
const JWT = require('jsonwebtoken');
const appDir = path.dirname(require.main.filename);

const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

cloudinary.config({
  cloud_name: config.get("cloudinary.cloud_name"),
  api_key: config.get("cloudinary.api_key"),
  api_secret: config.get("cloudinary.api_secret"),
});

/**
 * Creates an instance of food type service
 */
class FoodTypeService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new food type
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createFoodType(req, res, next) {
    let userId = JWT.decode(req.headers['x-request-jwt']).sub;
    let foodTypeName = req.swagger.params.food_type_name.value;
    let foodTypeIcon = req.swagger.params.food_type_icon.value;
    let foodTypeDetails = new FoodType({
      _id: new ObjectId(),
      name: foodTypeName,
      created_by: userId,
    });
    async.parallel(
      [
        (cb) => {
          CheckFoodType({ name: { $regex: new RegExp("^" + foodTypeName, "i") } }, (checkError, checkResult) => {
            if (checkError) {
              return cb(checkError);
            }
            if (!_.isEmpty(checkResult)) {
              let validationErrorObj = new ValidationError(
                "The food type with name " + foodTypeName + " already exists"
              );
              return cb(validationErrorObj);
            }
            return cb();
          });
        },
        (cb) => {
          if (!_.isEmpty(foodTypeIcon)) {
            _uploadToS3(
              foodTypeIcon,
              foodTypeDetails._id,
              (uploadError, uploadFile) => {
                if (uploadError) {
                  return cb(uploadError);
                }
                return cb(null, uploadFile.Location);
              }
            );
          } else {
            return cb();
          }
        },
      ],
      (parallelError, parallelResult) => {
        if (parallelError) {
          return next(parallelError);
        }
        let uploadUrl = parallelResult[1];
        foodTypeDetails.avatar_url = uploadUrl;
        foodTypeDetails.save((saveError, saveRecord) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while creating a new food type",
              saveError
            );
            return next(runtimeError);
          }
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 201;
          res.end(JSON.stringify(saveRecord));
        });
      }
    );
  }

  /**
   * Get all food types
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getFoodTypeList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (query.keyword) {
      query.name = {$regex: new RegExp('.*' + keyword + '.*', 'i')}
      delete query.keyword;
    }
    FoodType.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all food types",
          findError
        );
        return next(runtimeError);
      }
      if (_.isEmpty(findRecords)) {
        res.statusCode = 204;
        return res.end();
      }
      res.statusCode = 200;
      res.end(JSON.stringify(findRecords));
    });
  }

  /**
   * Gets food type details of given food_type_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getFoodType(swaggerParams, res, next) {
    let foodTypeId = swaggerParams.food_type_id.value;
    CheckFoodType({ _id: foodTypeId }, (checkError, checkResult) => {
      if (checkError) {
        return next(checkError);
      }
      if (_.isEmpty(checkResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The food type with id " + foodTypeId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(checkResult));
    });
  }

  /**
   * Updates food type details of given food_type_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateFoodType(swaggerParams, res, next) {
    let foodTypeId = swaggerParams.food_type_id.value;
    let foodTypeName = swaggerParams.food_type_name.value;
    let foodTypeIcon = swaggerParams.food_type_icon.value;
    async.parallel(
      [
        (cb) => {
          CheckFoodType({ _id: foodTypeId }, (checkError, checkResult) => {
            if (checkError) {
              return cb(checkError);
            }
            if (_.isEmpty(checkResult)) {
              let resourceNotFoundOErrorObj = new ResourceNotFoundError(
                "The food type with id " + foodTypeId + " does not exists"
              );
              return cb(resourceNotFoundOErrorObj);
            }
            return cb(null, checkResult);
          });
        },
        (cb) => {
          if (foodTypeName) {
            let foodName = _.trim(foodTypeName);
            FoodType.findOne(
              {
                name: { $regex: new RegExp("^" + foodName, "i") },
                _id: { $ne: foodTypeId },
              },
              (nameFindError, nameRecord) => {
                if (nameFindError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while fetching food type with name " +
                      foodName,
                    nameFindError
                  );
                  return cb(runtimeError);
                }
                if (!_.isEmpty(nameRecord)) {
                  let validationErrorObj = new ValidationError(
                    "The food type with food type name " +
                      foodName +
                      " already exist in the system"
                  );
                  return cb(validationErrorObj);
                }
                return cb();
              }
            );
          } else {
            return cb();
          }
        },
        (cb) => {
          if (!_.isEmpty(foodTypeIcon)) {
            _uploadToS3(
              foodTypeIcon,
              foodTypeId,
              (uploadError, uploadFile) => {
                if (uploadError) {
                  return cb(uploadError);
                }
                return cb(null, uploadFile.Location);
              }
            );
          } else {
            return cb();
          }
        },
      ],
      (parallelError, result) => {
        if (parallelError) {
          return next(parallelError);
        }
        let typeRecord = result[0];
        let imgUrl = result[2];
        typeRecord.name = foodTypeName ? foodTypeName : typeRecord.name;
        typeRecord.avatar_url = imgUrl ? imgUrl : typeRecord.avatar_url;
        typeRecord.save((saveError, saveRecord) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while updating a food type",
              saveError
            );
            return next(runtimeError);
          }
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify(saveRecord));
        });
      }
    );
  }

  /**
   * Updates food type status of given food_type_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateFoodTypeStatus(swaggerParams, res, next) {
    let foodTypeId = swaggerParams.food_type_id.value;
    let foodType = swaggerParams.foodType.value;
    CheckFoodType({ _id: foodTypeId }, (checkError, checkResult) => {
      if (checkError) {
        return next(checkError);
      }
      if (_.isEmpty(checkResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The food type with id " + foodTypeId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      checkResult.is_deleted = foodType.is_deleted;
      checkResult.save((saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a food type status",
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(saveRecord));
      });
    });
  }

  /**
   * Creates bulk food type
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  bulkCreateFoodType(req, res, next) {
    let excelFile = req.files.file[0];
    let userId = req.authentication.jwt.payload.user_id;
    if (
      ["xlsx"].indexOf(
        excelFile.originalname.split(".")[
          excelFile.originalname.split(".").length - 1
        ]
      ) === -1
    ) {
      let validationErrorObj = new ValidationError(
        "File should be of xlsx extension type"
      );
      return next(validationErrorObj);
    }
    const stream = Readable.from(excelFile.buffer);
    const name = new Date().getTime();
    const writeStream = fs.createWriteStream(`assets/${name}.xlsx`);

    stream.pipe(writeStream);
    fs.readFile(`${appDir}/assets/${name}.xlsx`, function read(err, data) {
      if (err) {
        let runtimeError = new RuntimeError(
          "There was an error while reading file data",
          err
        );
        return next(runtimeError);
      }
      const wb = XLSX.read(data, { type: "buffer" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      let list = XLSX.utils.sheet_to_json(ws);
      if (list.length <= 0) {
        let validationErrorObj = new ValidationError(
          "File should not be blank"
        );
        return next(validationErrorObj);
      }
      let foodTypeList = [];
      foodTypeList = _.map(list, (obj) => {
        obj.created_by = userId;
        return _.pick(obj, ["name", "avatar_url", "is_deleted", "created_by"]);
      });
      foodTypeList = _.filter(foodTypeList, (foodObj) => {
        return Object.keys(foodObj).length > 0;
      });
      if (foodTypeList.length <= 0) {
        let validationErrorObj = new ValidationError(
          "Please add matching data as per sample"
        );
        return next(validationErrorObj);
      }
      fs.unlinkSync(`${appDir}/assets/${name}.xlsx`);
      FoodType.insertMany(foodTypeList, (saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while creating bulk of food type",
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 201;
        res.end(JSON.stringify(saveRecord));
      });
    });
  }
}

/**
 * Checks for food type existence
 *
 * @param {Object} query - The food type findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckFoodType(query, callback) {
  FoodType.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding food type",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    return callback(null, findRecord);
  });
}

/**
 * Handles the file upload to S3
 *
 * @param {String} file - The file to upload
 * @param {String} foodTypeId - The foodTypeId for uploading file
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function _uploadToS3(file, foodTypeId, callback) {
  let extention = file.originalname.split(".").pop();
  let fileName = new Date().getTime() + "." + extention;
  let awsFileLocation = "food-types/" + foodTypeId + "/" + fileName;
  let params = {
    Key: awsFileLocation,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  uploadS3(params, callback);
}

module.exports = FoodTypeService;
