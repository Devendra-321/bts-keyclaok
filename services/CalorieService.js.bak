"use strict";

const fs = require("fs");
const _ = require("lodash");
const XLSX = require("xlsx");
const path = require("path");
const async = require("async");
const { Readable } = require("stream");
const { Calorie } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require('jsonwebtoken');
const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

const appDir = path.dirname(require.main.filename);

/**
 * Creates an instance of calorie service
 */
class CalorieService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new calorie
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createCalorie(req, res, next) {
    let userId = JWT.decode(req.headers['x-request-jwt']).sub;
    let calorie = req.swagger.params.calorie.value;
    let calorieDetails = new Calorie({
      name: calorie.name,
      is_deleted: calorie.is_deleted,
      created_by: userId,
    });
    CheckCalorie({ name: calorie.name }, (checkError, checkResult) => {
      if (checkError) {
        return next(checkError);
      }
      if (!_.isEmpty(checkResult)) {
        let validationErrorObj = new ValidationError(
          "The calorie with name " + calorie.name + " already exists"
        );
        return next(validationErrorObj);
      }
      calorieDetails.save((saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while creating a new calorie",
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

  /**
   * Get all calories
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getCalorieList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (query.keyword) {
      query.name = {$regex: new RegExp('.*' + keyword + '.*', 'i')}
      delete query.keyword;
    }
    Calorie.find(query, (findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all calories",
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
   * Gets calorie details of given calorie_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getCalorie(swaggerParams, res, next) {
    let calorieId = swaggerParams.calorie_id.value;
    CheckCalorie({ _id: calorieId }, (checkError, checkResult) => {
      if (checkError) {
        return next(checkError);
      }
      if (_.isEmpty(checkResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The calorie with id " + calorieId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(checkResult));
    });
  }

  /**
   * Updates calorie details of given calorie_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateCalorie(swaggerParams, res, next) {
    let calorieId = swaggerParams.calorie_id.value;
    let calorie = swaggerParams.calorie.value;
    async.parallel(
      [
        (cb) => {
          CheckCalorie({ _id: calorieId }, (checkError, checkResult) => {
            if (checkError) {
              return cb(checkError);
            }
            if (_.isEmpty(checkResult)) {
              let resourceNotFoundOErrorObj = new ResourceNotFoundError(
                "The calorie with id " + calorieId + " does not exists"
              );
              return cb(resourceNotFoundOErrorObj);
            }
            return cb(null, checkResult);
          });
        },
        (cb) => {
          if (calorie.name) {
            let calorieName = _.trim(calorie.name);
            Calorie.findOne(
              {
                name: { $regex: new RegExp("^" + calorieName, "i") },
                _id: { $ne: calorieId },
              },
              (nameFindError, nameRecord) => {
                if (nameFindError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while fetching calorie with name " +
                      calorieName,
                    nameFindError
                  );
                  return cb(runtimeError);
                }
                if (!_.isEmpty(nameRecord)) {
                  let validationErrorObj = new ValidationError(
                    "The calorie with calorie name " +
                      calorieName +
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
      ],
      (parallelError, result) => {
        if (parallelError) {
          return next(parallelError);
        }
        let calorieRecord = result[0];
        calorieRecord.name = calorie.name ? calorie.name : calorieRecord.name;
        calorieRecord.is_deleted =
          calorie.is_deleted != undefined
            ? calorie.is_deleted
            : calorieRecord.is_deleted;
        calorieRecord.save((saveError, saveRecord) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while updating a calorie",
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
   * Creates bulk of calorie
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  bulkCreateCalorie(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let excelFile = req.files.file[0];
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
      let dataList = [];
      dataList = _.map(list, (obj) => {
        obj.created_by = userId;
        return _.pick(obj, ["name", "is_deleted", "created_by"]);
      });
      dataList = _.filter(dataList, (Obj) => {
        return Object.keys(Obj).length > 0;
      });
      if (dataList.length <= 0) {
        let validationErrorObj = new ValidationError(
          "Please add matching data as per sample"
        );
        return next(validationErrorObj);
      }
      fs.unlinkSync(`${appDir}/assets/${name}.xlsx`);
      Calorie.insertMany(dataList, (saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while creating bulk of calorie",
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
 * Checks for calorie existence
 *
 * @param {Object} query - The calorie findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckCalorie(query, callback) {
  Calorie.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding calorie",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    return callback(null, findRecord);
  });
}

module.exports = CalorieService;
