"use strict";

const _ = require("lodash");
const async = require("async");
const { ObjectId } = require("mongoose").Types;
const { uploadS3 } = require("../helpers/AWSHelper");
const { Branch } = require("../models");

const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of branch service
 */
class BranchService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new branch
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createBranch(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let branchName = req.swagger.params.branch_name.value;
    let website = req.swagger.params.branch_website.value;
    let map = req.swagger.params.branch_map.value;
    let address = req.swagger.params.branch_address.value;
    let branchIcon = req.swagger.params.branch_icon.value;
    let isDeleted = req.swagger.params.is_deleted.value;
    let branchDetails = new Branch({
      _id: new ObjectId(),
      name: branchName,
      website,
      map,
      address,
      is_deleted: isDeleted,
      created_by: userId,
    });
    async.parallel(
      [
        (cb) => {
          CheckBranch({ name: { $regex: new RegExp("^" + branchName, "i") } }, (checkError, checkResult) => {
            if (checkError) {
              return cb(checkError);
            }
            if (!_.isEmpty(checkResult)) {
              let validationErrorObj = new ValidationError(
                "The branch with name " + branchName + " already exists"
              );
              return cb(validationErrorObj);
            }
            return cb();
          });
        },
        (cb) => {
          if (!_.isEmpty(branchIcon)) {
            _uploadToS3(
              branchIcon,
              branchDetails._id,
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
        branchDetails.image_url = uploadUrl;
        branchDetails.save((saveError, saveRecord) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while creating a new branch",
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
   * Get all branch
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getBranchList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (query.keyword) {
      query.name = {$regex: new RegExp('.*' + keyword + '.*', 'i')}
      delete query.keyword;
    }
    Branch.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all branches",
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
   * Get branch with given branch_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getBranch(swaggerParams, res, next) {
    let branchId = swaggerParams.branch_id.value;
    CheckBranch({ _id: branchId }, (checkError, checkResult) => {
      if (checkError) {
        return next(checkError);
      }
      if (_.isEmpty(checkResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The branch with id " + branchId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(checkResult));
    });
  }

  /**
   * Update branch with given branch_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateBranch(swaggerParams, res, next) {
    let branchId = swaggerParams.branch_id.value;
    let branchName = swaggerParams.branch_name.value;
    let website = swaggerParams.branch_website.value;
    let map = swaggerParams.branch_map.value;
    let address = swaggerParams.branch_address.value;
    let branchIcon = swaggerParams.branch_icon.value;
    let isDeleted = swaggerParams.is_deleted.value;
    async.parallel(
      [
        (cb) => {
          CheckBranch({ _id: branchId }, (checkError, checkResult) => {
            if (checkError) {
              return cb(checkError);
            }
            if (_.isEmpty(checkResult)) {
              let resourceNotFoundOErrorObj = new ResourceNotFoundError(
                "The branch with id " + branchId + " does not exists"
              );
              return cb(resourceNotFoundOErrorObj);
            }
            return cb(null, checkResult);
          });
        },
        (cb) => {
          if (branchName) {
            let trimName = _.trim(branchName);
            Branch.findOne(
              {
                name: { $regex: new RegExp("^" + trimName, "i") },
                _id: { $ne: branchId },
              },
              (nameFindError, nameRecord) => {
                if (nameFindError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while fetching branch with name " +
                      branchName,
                    nameFindError
                  );
                  return cb(runtimeError);
                }
                if (!_.isEmpty(nameRecord)) {
                  let validationErrorObj = new ValidationError(
                    "The branch with branch name " +
                      branchName +
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
          if (!_.isEmpty(branchIcon)) {
            _uploadToS3(
              branchIcon,
              branchId,
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
        let branchRecord = result[0];
        let imgUrl = result[2];
        branchRecord.name = branchName ? branchName : branchRecord.name;
        branchRecord.website = website ? website : branchRecord.website;
        branchRecord.map = map ? map : branchRecord.map;
        branchRecord.address = address ? address : branchRecord.address;
        branchRecord.is_deleted = isDeleted != undefined ? isDeleted : branchRecord.is_deleted;
        branchRecord.image_url = imgUrl ? imgUrl : branchRecord.image_url;
        branchRecord.save((saveError, saveRecord) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while updating a branch",
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
 * Checks for branch existence
 *
 * @param {Object} query - The branch findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckBranch(query, callback) {
  Branch.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding branch",
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
 * @param {String} branchId - The branchId for uploading file
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function _uploadToS3(file, branchId, callback) {
  let extention = file.originalname.split(".").pop();
  let fileName = new Date().getTime() + "." + extention;
  let awsFileLocation = "branch/" + branchId + "/" + fileName;
  let params = {
    Key: awsFileLocation,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  uploadS3(params, callback);
}

module.exports = BranchService;
