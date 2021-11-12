"use strict";

const _ = require("lodash");
const async = require("async");
const { FilterType, FilterData } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require("jsonwebtoken");

const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");


/**
 * Creates an instance of filter type service
 */
class FilterTypeService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new filter type
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createFilterType(req, res, next) {
    let userId = JWT.decode(req.headers["x-request-jwt"]).sub; //req.authentication.jwt.payload.user_id;
    let filter = req.swagger.params.filterType.value;
    let filterDetails = new FilterType({
      name: filter.name,
      is_deleted: filter.is_deleted,
      created_by: userId
    });
    CheckFilterType(
      { name: { $regex: new RegExp("^" + filter.name, "i") } , is_removed: false },
      (checkError, checkResult) => {
        if (checkError) {
          return next(checkError);
        }
        if (!_.isEmpty(checkResult)) {
          let validationErrorObj = new ValidationError(
            "The filter type with name " + filter.name + " already exists"
          );
          return next(validationErrorObj);
        }
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
      }
    );
  }

  /**
   * Get all filter-types
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getFilterTypeList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (query.keyword) {
      query.name = {$regex: new RegExp('.*' + keyword + '.*', 'i')}
      delete query.keyword;
    }
    query.is_removed = false;
    FilterType.find(query, (findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all filter types",
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
 * Get all filter-types with filter data
 *
 * @param {object} swaggerParams - The swagger parameter
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
   getFilterList(swaggerParams, res, next) {
    FilterType.find({ is_removed: false }, (findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all filter types",
          findError
        );
        return next(runtimeError);
      }
      if (_.isEmpty(findRecords)) {
        res.statusCode = 204;
        return res.end();
      }
      let filterTypeAry = [];
      async.eachLimit(
        findRecords,
        5,
        (filterObj, eachFilterCb) => {
          GetFilters({ filter_type_id: filterObj._id }, (fetchError, filterData) => {
            if (fetchError) {
              return eachProductCb(fetchError);
            }
            filterObj = filterObj.toObject();
            filterObj.filter_data = filterData;
            filterTypeAry.push(filterObj);
            return eachFilterCb();
          });
        },
        (eachError) => {
          if (eachError) {
            return next(eachError);
          }
          // filterTypeAry.sort((a, b) => b.created_at - a.created_at);
          filterTypeAry = _.sortBy(filterTypeAry, ['created_at'])
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(filterTypeAry));
        }
      );
    });
  }

  /**
   * Gets filter type details of given filter_type_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getFilterType(swaggerParams, res, next) {
    let filterTypeId = swaggerParams.filter_type_id.value;
    CheckFilterType(
      { _id: filterTypeId },
      (checkError, checkResult) => {
        if (checkError) {
          return next(checkError);
        }
        if (_.isEmpty(checkResult)) {
          let resourceNotFoundOErrorObj = new ResourceNotFoundError(
            "The filter type with id " + filterTypeId + " does not exists"
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
   * Updates filter type details of given filter_type_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateFilterType(swaggerParams, res, next) {
    let filterTypeId = swaggerParams.filter_type_id.value;
    let filter = swaggerParams.filterType.value;
    async.parallel(
      [
        (cb) => {
          CheckFilterType({ _id: filterTypeId }, (checkError, checkResult) => {
              if (checkError) {
                return cb(checkError);
              }
              if (_.isEmpty(checkResult)) {
                let resourceNotFoundOErrorObj = new ResourceNotFoundError(
                  "The filter type with id " + filterTypeId + " does not exists"
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
                _id: { $ne: filterTypeId },
              },
              (nameFindError, nameRecord) => {
                if (nameFindError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while fetching filter type with name " +
                      filterName,
                    nameFindError
                  );
                  return cb(runtimeError);
                }
                if (!_.isEmpty(nameRecord)) {
                  let validationErrorObj = new ValidationError(
                    "The filter type with name " +
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
        filterRecord.is_removed = filter.is_removed ? filter.is_removed : filterRecord.is_removed;
        filterRecord.is_deleted = filter.is_deleted != undefined ? filter.is_deleted : filterRecord.is_deleted;
        filterRecord.save((saveError, saveRecord) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while updating a filter type",
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
    return callback(null, findRecord);
  });
}

/**
 * Gets for filter data list
 *
 * @param {Object} query - The filter type findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
 function GetFilters(query, callback) {
  FilterData.find(query)
  .sort({'created_at': 1})
  .exec((findOneError, findRecords) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding filter data",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecords)) {
      findRecords = []
    }
    return callback(null, findRecords);
  });
}

module.exports = FilterTypeService;
