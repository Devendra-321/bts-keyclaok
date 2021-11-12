"use strict";

const fs = require('fs');
const _ = require("lodash");
const XLSX = require("xlsx");
const path = require("path");
const async = require("async");
const { Readable } = require('stream');
const { FilterType, FilterData } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

const appDir = path.dirname(require.main.filename);


/**
 * Creates an instance of filter data service
 */
class FilterDataService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new filter data
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createFilterData(req, res, next) {
    let userId = JWT.decode(req.headers['x-request-jwt']).sub;//req.authentication.jwt.payload.user_id;
    let filter = req.swagger.params.filter.value;
    let filterTypeId = filter.filter_type_id;
    async.parallel([
      (cb) => {
        CheckFilterType( { _id: filterTypeId, is_deleted: false }, cb);
      },
      (cb) => {
        let filterName = _.trim(filter.name);
        CheckFilterData(
          { name: { $regex: new RegExp("^" + filterName, "i") } },
          (checkError, checkResult) => {
            if (checkError) {
              return cb(checkError);
            }
            if (!_.isEmpty(checkResult)) {
              let validationErrorObj = new ValidationError(
                "The filter type with name " + filter.name + " already exists"
              );
              return cb(validationErrorObj);
            }
            return cb();
          });
      }
    ], (parallelError) => {
      if (parallelError) {
        return next(parallelError);
      }
      let filterDetails = new FilterData({
        name: filter.name,
        filter_type_id: filterTypeId,
        is_deleted: filter.is_deleted,
        created_by: userId
      });
      filterDetails.save((saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while creating a new filter",
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
   * Get all filter-data
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getFilterDataList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (query.keyword) {
      query.name = {$regex: new RegExp('.*' + keyword + '.*', 'i')}
      delete query.keyword;
    }
    FilterData.find(query, (findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all filter data",
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
   * Gets filter data details of given filter_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getFilterData(swaggerParams, res, next) {
    let filterId = swaggerParams.filter_id.value;
    CheckFilterData(
      { _id: filterId },
      (checkError, checkResult) => {
        if (checkError) {
          return next(checkError);
        }
        if (_.isEmpty(checkResult)) {
          let resourceNotFoundOErrorObj = new ResourceNotFoundError(
            "The filter data with id " + filterId + " does not exists"
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
   * Updates filter details of given filter_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateFilterData(swaggerParams, res, next) {
    let filterId = swaggerParams.filter_id.value;
    let filter = swaggerParams.filter.value;
    async.parallel(
      [
        (cb) => {
          CheckFilterData({ _id: filterId }, (checkError, checkResult) => {
              if (checkError) {
                return cb(checkError);
              }
              if (_.isEmpty(checkResult)) {
                let resourceNotFoundOErrorObj = new ResourceNotFoundError(
                  "The filter data with id " + filterId + " does not exists"
                );
                return cb(resourceNotFoundOErrorObj);
              }
              return cb(null, checkResult);
            }
          );
        },
        (cb) => {
          if (filter.name) {
            let filterName = _.trim(filter.name);
            FilterType.findOne(
              {
                name: { $regex: new RegExp("^" + filterName, "i") },
                _id: { $ne: filterId },
              },
              (nameFindError, nameRecord) => {
                if (nameFindError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while fetching filter data with name " + filterName,
                    nameFindError
                  );
                  return cb(runtimeError);
                }
                if (!_.isEmpty(nameRecord)) {
                  let validationErrorObj = new ValidationError(
                    "The filter data with name " +
                    filterName +
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
        let filterRecord = result[0];
        filterRecord.name = filter.name ? filter.name : filterRecord.name;
        filterRecord.filter_type_id = filter.filter_type_id ? filter.filter_type_id : filterRecord.filter_type_id;
        filterRecord.is_deleted = filter.is_deleted != undefined ? filter.is_deleted : filterRecord.is_deleted;
        filterRecord.save((saveError, saveRecord) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while updating a filter data",
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
   * Creates bulk of filter data
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   bulkCreateFilter(req, res, next) {
    let excelFile = req.files.file[0];
    let userId =JWT.decode(req.headers['x-request-jwt']).sub;// req.authentication.jwt.payload.user_id;
    let filterTypeId = req.swagger.params.filter_type_id.value;
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

    async.autoInject({
      readFile: (cb) => {
        fs.readFile(`${appDir}/assets/${name}.xlsx`, function read(err, data) {
          if (err) {
            let runtimeError = new RuntimeError(
              'There was an error while reading file data',
              err
            );
            return cb(runtimeError);
          }
          const wb = XLSX.read(data, { type: 'buffer' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          let list = XLSX.utils.sheet_to_json(ws);
          if (list.length <= 0) {
            let validationErrorObj = new ValidationError(
              "File should not be blank"
            );
            return cb(validationErrorObj);
          }
          return cb(null, list)
        });
      },
      deleteFile: (cb) => {
        fs.unlinkSync(`${appDir}/assets/${name}.xlsx`);
        return cb();
        // fs.unlinkSync(`${appDir}/assets/${name}.xlsx`, (err) => {
        //   console.log('calleddd');
        //   if (err.code === 'ENOENT') {
        //     let runtimeError = new RuntimeError(
        //       'There was an error while deleting file',
        //       err
        //     );
        //     return cb(runtimeError);
        //   }
        //   console.log('calleddd out');
        //   return cb();
        // });
      },
      validateData: (readFile, cb) => {
        let dataList = [];
        dataList = _.map(readFile, (obj) => {
          obj.created_by = userId;
          obj.filter_type_id = filterTypeId;
          return _.pick(obj, ['name', 'is_deleted', 'filter_type_id', 'created_by'])
        })
        dataList = _.filter(dataList, (Obj) => {
          return Object.keys(Obj).length > 0
        });
        if (dataList.length <= 0) {
          let validationErrorObj = new ValidationError(
            "Please add matching data as per sample"
          );
          return cb(validationErrorObj);
        }
        return cb(null, dataList);
      }
    }, (autoInjectError, result) => {
      if (autoInjectError) {
        return next(autoInjectError);
      }
      FilterData.insertMany(result.validateData, (saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while creating bulk of filter data",
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 201;
        res.end(JSON.stringify(saveRecord));
      })
    })

    
    // fs.readFile(`${appDir}/assets/${name}.xlsx`, function read(err, data) {
    //   if (err) {
    //     let runtimeError = new RuntimeError(
    //       'There was an error while reading file data',
    //       err
    //     );
    //     return next(runtimeError);
    //   }
    //   const wb = XLSX.read(data, { type: 'buffer' });
    //   const wsname = wb.SheetNames[0];
    //   const ws = wb.Sheets[wsname];
    //   let list = XLSX.utils.sheet_to_json(ws);
    //   if (list.length <= 0) {
    //     let validationErrorObj = new ValidationError(
    //       "File should not be blank"
    //     );
    //     return next(validationErrorObj);
    //   }
    //   let dataList = [];
    //   dataList = _.map(list, (obj) => {
    //     obj.created_by = userId;
    //     obj.filter_type_id = filterTypeId;
    //     return _.pick(obj, ['name', 'is_deleted', 'filter_type_id', 'created_by'])
    //   })
    //   dataList = _.filter(dataList, (Obj) => {
    //     return Object.keys(Obj).length > 0
    //   });
    //   if (dataList.length <= 0) {
    //     let validationErrorObj = new ValidationError(
    //       "Please add matching data as per sample"
    //     );
    //     return next(validationErrorObj);
    //   }
    //   fs.unlinkSync(`${appDir}/assets/${name}.xlsx`);
    //   FilterData.insertMany(dataList, (saveError, saveRecord) => {
    //     if (saveError) {
    //       let runtimeError = new RuntimeError(
    //         "There was an error while creating bulk of filter data",
    //         saveError
    //       );
    //       return next(runtimeError);
    //     }
    //     res.setHeader("Content-Type", "application/json");
    //     res.statusCode = 201;
    //     res.end(JSON.stringify(saveRecord));
    //   })
    // });
  }
}

/**
 * Checks for filter type existence
 *
 * @param {Object} query - The filter type findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckFilterType(query, callback) {
  FilterType.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding filter type",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let validationErrorObj = new ValidationError(
        "The filter type with id " + query._id + " does not exists"
      );
      return callback(validationErrorObj);
    }
    return callback(null, findRecord);
  });
}

/**
 * Checks for filter data existence
 *
 * @param {Object} query - The filter data findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
 function CheckFilterData(query, callback) {
  FilterData.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding filter data",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    return callback(null, findRecord);
  });
}

module.exports = FilterDataService;
