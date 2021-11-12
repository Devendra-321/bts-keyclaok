"use strict";

const fs = require('fs');
const _ = require("lodash");
const XLSX = require("xlsx");
const path = require("path");
const async = require("async");
const { Readable } = require('stream');
const { Spice } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require('jsonwebtoken');
const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

const appDir = path.dirname(require.main.filename);

/**
 * Creates an instance of spice service
 */
class SpiceService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new spice
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createSpice(req, res, next) {
    let userId = JWT.decode(req.headers['x-request-jwt']).sub;
    let spice = req.swagger.params.spice.value;
    let spiceDetails = new Spice({
      name: spice.name,
      is_deleted: spice.is_deleted,
      created_by: userId
    });
    CheckSpice(
      { name: spice.name },
      (checkError, checkResult) => {
        if (checkError) {
          return next(checkError);
        }
        if (!_.isEmpty(checkResult)) {
          let validationErrorObj = new ValidationError(
            "The spice with name " + spice.name + " already exists"
          );
          return next(validationErrorObj);
        }
        spiceDetails.save((saveError, saveRecord) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while creating a new spice",
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
   * Get all spice levels
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getSpiceList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (query.keyword) {
      query.name = {$regex: new RegExp('.*' + keyword + '.*', 'i')}
      delete query.keyword;
    }
    Spice.find(query, (findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all spice levels",
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
   * Gets spice details of given spice_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getSpice(swaggerParams, res, next) {
    let spiceId = swaggerParams.spice_id.value;
    CheckSpice(
      { _id: spiceId },
      (checkError, checkResult) => {
        if (checkError) {
          return next(checkError);
        }
        if (_.isEmpty(checkResult)) {
          let resourceNotFoundOErrorObj = new ResourceNotFoundError(
            "The spice with id " + spiceId + " does not exists"
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
   * Updates spice details of given spice_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateSpice(swaggerParams, res, next) {
    let spiceId = swaggerParams.spice_id.value;
    let spice = swaggerParams.spice.value;
    async.parallel(
      [
        (cb) => {
          CheckSpice({ _id: spiceId }, (checkError, checkResult) => {
              if (checkError) {
                return cb(checkError);
              }
              if (_.isEmpty(checkResult)) {
                let resourceNotFoundOErrorObj = new ResourceNotFoundError(
                  "The spice with id " + spiceId + " does not exists"
                );
                return cb(resourceNotFoundOErrorObj);
              }
              return cb(null, checkResult);
            }
          );
        },
        (cb) => {
          if (spice.name) {
            let spiceName = _.trim(spice.name);
            Spice.findOne(
              {
                name: { $regex: new RegExp("^" + spiceName, "i") },
                _id: { $ne: spiceId },
              },
              (nameFindError, nameRecord) => {
                if (nameFindError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while fetching spice with name " +
                      spiceName,
                    nameFindError
                  );
                  return cb(runtimeError);
                }
                if (!_.isEmpty(nameRecord)) {
                  let validationErrorObj = new ValidationError(
                    "The spice with spice name " +
                      spiceName +
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
        let spiceRecord = result[0];
        spiceRecord.name = spice.name ? spice.name : spiceRecord.name;
        spiceRecord.is_deleted = spice.is_deleted != undefined ? spice.is_deleted : spiceRecord.is_deleted;
        spiceRecord.save((saveError, saveRecord) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while updating a spice",
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
   * Creates bulk of spice
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  bulkCreateSpice(req, res, next) {
  let excelFile = req.files.file[0];
  let userId =JWT.decode(req.headers['x-request-jwt']).sub;// req.authentication.jwt.payload.user_id;
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
    Spice.insertMany(dataList, (saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating bulk of spice",
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
 * Checks for spice existence
 *
 * @param {Object} query - The spice findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckSpice(query, callback) {
  Spice.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding spice",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    return callback(null, findRecord);
  });
}

module.exports = SpiceService;
