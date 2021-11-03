"use strict";

const fs = require('fs');
const _ = require("lodash");
const XLSX = require("xlsx");
const path = require("path");
const async = require("async");
const { Readable } = require('stream');
const { Allergy } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require('jsonwebtoken');
 
const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

const appDir = path.dirname(require.main.filename);

/**
 * Creates an instance of allergy service
 */
class AllergyService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new allergy
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createAllergy(req, res, next) {
    console.log(JWT.decode(req.headers['x-request-jwt']).sub);
    let userId = JWT.decode(req.headers['x-request-jwt']).sub; // req.authentication.jwt.payload.user_id;
    let allergy = req.swagger.params.allergy.value;
    let allergyDetails = new Allergy({
      name: allergy.name,
      is_deleted: allergy.is_deleted,
      created_by: userId
    });
    CheckAllergy(
      { name: allergy.name },
      (checkError, checkResult) => {
        if (checkError) {
          return next(checkError);
        }
        if (!_.isEmpty(checkResult)) {
          let validationErrorObj = new ValidationError(
            "The allergy with name " + allergy.name + " already exists"
          );
          return next(validationErrorObj);
        }
        allergyDetails.save((saveError, saveRecord) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while creating a new allergy",
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
   * Get all allergies
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getAllergyList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (query.keyword) {
      query.name = {$regex: new RegExp('.*' + keyword + '.*', 'i')}
      delete query.keyword;
    }
    Allergy.find(query, (findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all allergies",
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
   * Gets allergy details of given allergy_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getAllergy(swaggerParams, res, next) {
    let allergyId = swaggerParams.allergy_id.value;
    CheckAllergy(
      { _id: allergyId },
      (checkError, checkResult) => {
        if (checkError) {
          return next(checkError);
        }
        if (_.isEmpty(checkResult)) {
          let resourceNotFoundOErrorObj = new ResourceNotFoundError(
            "The allergy with id " + allergyId + " does not exists"
          );
          return next(resourceNotFoundOErrorObj);
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(checkResult));
      }
    );
  }

  /**
   * Updates allergy details of given allergy_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateAllergy(swaggerParams, res, next) {
    let allergyId = swaggerParams.allergy_id.value;
    let allergy = swaggerParams.allergy.value;
    async.parallel(
      [
        (cb) => {
          CheckAllergy({ _id: allergyId }, (checkError, checkResult) => {
              if (checkError) {
                return cb(checkError);
              }
              if (_.isEmpty(checkResult)) {
                let resourceNotFoundOErrorObj = new ResourceNotFoundError(
                  "The allergy with id " + allergyId + " does not exists"
                );
                return cb(resourceNotFoundOErrorObj);
              }
              return cb(null, checkResult);
            }
          );
        },
        (cb) => {
          if (allergy.name) {
            let allergyName = _.trim(allergy.name);
            Allergy.findOne(
              {
                name: { $regex: new RegExp("^" + allergyName, "i") },
                _id: { $ne: allergyId },
              },
              (nameFindError, nameRecord) => {
                if (nameFindError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while fetching allergy with name " +
                      allergyName,
                    nameFindError
                  );
                  return cb(runtimeError);
                }
                if (!_.isEmpty(nameRecord)) {
                  let validationErrorObj = new ValidationError(
                    "The allergy with allergy name " +
                      allergyName +
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
        let allergyRecord = result[0];
        allergyRecord.name = allergy.name ? allergy.name : allergyRecord.name;
        allergyRecord.is_deleted = allergy.is_deleted != undefined ? allergy.is_deleted : allergyRecord.is_deleted;
        allergyRecord.save((saveError, saveAllergy) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while updating a allergy",
              saveError
            );
            return next(runtimeError);
          }
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify(saveAllergy));
        });
      }
    );
  }

  /**
   * Creates bulk of allergy
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   bulkCreateAllergy(req, res, next) {
    let excelFile = req.files.file[0];
    let userId = req.authentication.jwt.payload.user_id;
    if (['xlsx'].indexOf(excelFile.originalname.split('.')[excelFile.originalname.split('.').length-1]) === -1) {
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
          'There was an error while reading file data',
          err
        );
        return next(runtimeError);
      }
      const wb = XLSX.read(data, { type: 'buffer' });
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
        return _.pick(obj, ['name', 'is_deleted', 'created_by'])
      })
      dataList = _.filter(dataList, (Obj) => {
        return Object.keys(Obj).length > 0
      });
      if (dataList.length <= 0) {
        let validationErrorObj = new ValidationError(
          "Please add matching data as per sample"
        );
        return next(validationErrorObj);
      }
      fs.unlinkSync(`${appDir}/assets/${name}.xlsx`);
      Allergy.insertMany(dataList, (saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while creating bulk of allergy",
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 201;
        res.end(JSON.stringify(saveRecord));
      })
    });
  }
}

/**
 * Checks for allergy existence
 *
 * @param {Object} query - The allergy findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckAllergy(query, callback) {
  Allergy.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding allergy",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    return callback(null, findRecord);
  });
}

module.exports = AllergyService;
