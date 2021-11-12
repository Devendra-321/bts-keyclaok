"use strict";

const fs = require("fs");
const _ = require("lodash");
const XLSX = require("xlsx");
const path = require("path");
const async = require("async");
const { Readable } = require("stream");
const { ObjectId } = require("mongoose").Types;
const appDir = path.dirname(require.main.filename);
const { Category, SubCategory, FoodType, Item } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  RuntimeError,
  ValidationError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of sub-category service
 */
class SubCategoryService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new sub-category
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createSubCategory(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let subCategory = req.swagger.params.subCategory.value;
    let categoryId = subCategory.category_id;
    let subCategoryName = _.trim(subCategory.name);
    async.parallel(
      [
        (cb) => {
          if (categoryId) {
            checkCategory(
              { _id: categoryId, is_deleted: false },
              (categoryCheckError) => {
                if (categoryCheckError) {
                  return cb(categoryCheckError);
                }
                return cb();
              }
            );
          } else {
            return cb();
          }
        },
        (cb) => {
          SubCategory.findOne(
            {
              category_id: categoryId,
              name: { $regex: new RegExp("^" + subCategoryName, "i") },
            },
            (subCategoryError, subCategoryRecord) => {
              if (subCategoryError) {
                let runtimeError = new RuntimeError(
                  "There was an error while finding a sub-category with sub-category name" +
                    subCategoryName,
                  subCategoryError
                );
                return cb(runtimeError);
              }
              if (!_.isEmpty(subCategoryRecord)) {
                let validationErrorObj = new ValidationError(
                  "The subCategory with name " +
                    subCategoryName +
                    " already exist in the system"
                );
                return cb(validationErrorObj);
              }
              return cb();
            }
          );
        },
        (cb) => {
          checkSubCategoryMaxOrder(
            { panel_type: subCategory.panel_type },
            (maxCheckError, maxResult) => {
              if (maxCheckError) {
                return cb(maxCheckError);
              }
              return cb(null, maxResult);
            }
          );
        },
      ],
      (parallelError, parallelResult) => {
        if (parallelError) {
          return next(parallelError);
        }
        let max = parallelResult[2];
        let subCategoryDetails = new SubCategory({
          category_id: categoryId,
          name: subCategory.name,
          description: subCategory.description,
          is_deleted: subCategory.is_deleted,
          created_by: userId,
          panel_type: subCategory.panel_type,
          is_web: subCategory.is_web,
          allergy_ids: subCategory.allergy_ids,
          food_type_ids: subCategory.food_type_ids,
          is_tw: subCategory.is_tw,
          is_discount_applied: subCategory.is_discount_applied,
          order: max + 1,
        });
        subCategoryDetails.save((saveError, saveSubCategory) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while creating a new subCategory",
              saveError
            );
            return next(runtimeError);
          }
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 201;
          res.end(JSON.stringify(saveSubCategory));
        });
      }
    );
  }

  /**
   * Gets list of sub-categories
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getSubCategoryList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    let queryArray = [];
    let condition = {
      $match: {},
    };

    if (!_.isUndefined(query.is_deleted)) {
      condition["$match"].is_deleted = query.is_deleted;
    }

    if (query.category_id) {
      condition["$match"].category_id = ObjectId(query.category_id);
    }

    if (query.panel_type) {
      condition["$match"].panel_type = query.panel_type;
    }

    if (query.food_type_ids) {
      condition["$match"].food_type_ids = { $in: [query.food_type_ids] };
    }
    queryArray.push(condition);
    queryArray.push({
      $lookup: {
        from: "Category",
        localField: "category_id",
        foreignField: "_id",
        as: "category_data",
      },
    });
    let subCategoryMatch = {
      $match: {
        $or: [],
      },
    };

    if (keyword) {
      subCategoryMatch["$match"]["$or"].push(
        {
          "category_data.name": {
            $regex: new RegExp(".*" + keyword + ".*", "i"),
          },
        },
        { name: { $regex: new RegExp(".*" + keyword + ".*", "i") } },
        { description: { $regex: new RegExp(".*" + keyword + ".*", "i") } }
      );
      delete query.keyword;
    }

    if (subCategoryMatch["$match"]["$or"].length > 0) {
      queryArray.push(subCategoryMatch);
    }

    SubCategory.aggregate(queryArray)
      .sort({ order: 1 })
      .exec((subCategoryFindError, subCategoryRecords) => {
        if (subCategoryFindError) {
          let runtimeError = new RuntimeError(
            "There was an error while fetching all sub-categories",
            subCategoryFindError
          );
          return next(runtimeError);
        }
        if (_.isEmpty(subCategoryRecords)) {
          res.statusCode = 204;
          return res.end();
        }
        let subCategoryAry = [];
        async.eachLimit(
          subCategoryRecords,
          5,
          (subObj, eachSubCategoryCb) => {
            if (subObj.category_data && subObj.category_data.length) {
              subObj.category_name = subObj.category_data[0].name;
            }
            subCategoryAry.push(subObj);
            delete subObj.category_data;
            return eachSubCategoryCb();
          },
          (eachError) => {
            if (eachError) {
              return next(eachError);
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(subCategoryAry));
          }
        );
      });
  }

  /**
   * Gets subCategory details of given sub_category_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getSubCategory(swaggerParams, res, next) {
    let subCategoryId = swaggerParams.sub_category_id.value;
    checkSubCategory(
      { _id: subCategoryId },
      (subCategoryCheckError, subCategoryCheckResult) => {
        if (subCategoryCheckError) {
          return next(subCategoryCheckError);
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(subCategoryCheckResult));
      }
    );
  }

  /**
   * Updates sub-category details of given sub_category_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateSubCategory(swaggerParams, res, next) {
    let subCategoryId = swaggerParams.sub_category_id.value;
    let payload = swaggerParams.subCategory.value;

    async.parallel(
      [
        (cb) => {
          checkSubCategory(
            { _id: subCategoryId },
            (subCategoryCheckError, subCategoryCheckResult) => {
              if (subCategoryCheckError) {
                return cb(subCategoryCheckError);
              }
              cb(null, subCategoryCheckResult);
            }
          );
        },
        (cb) => {
          if (payload.category_id) {
            checkCategory(
              { _id: payload.category_id, is_deleted: false },
              (categoryCheckError) => {
                if (categoryCheckError) {
                  return cb(categoryCheckError);
                }
                return cb();
              }
            );
          } else {
            return cb();
          }
        },
        (cb) => {
          if (payload.name) {
            let subCategoryName = _.trim(payload.name);
            SubCategory.findOne(
              {
                name: { $regex: new RegExp("^" + subCategoryName, "i") },
                _id: { $ne: subCategoryId },
              },
              (subCategoryNameFindError, subCategoryNameRecord) => {
                if (subCategoryNameFindError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while fetching sub-category with name " +
                      subCategoryName,
                    subCategoryNameFindError
                  );
                  return cb(runtimeError);
                }
                if (!_.isEmpty(subCategoryNameRecord)) {
                  let validationErrorObj = new ValidationError(
                    "The sub-category name " +
                      subCategoryName +
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
          if (payload.food_type_ids) {
            async.eachLimit(
              payload.food_type_ids,
              2,
              (foodTypeId, eachCb) => {
                CheckFoodType({ _id: foodTypeId, is_deleted: false }, eachCb);
              },
              (eachError) => {
                if (eachError) {
                  return cb(eachError);
                }
                return cb();
              }
            );
          } else {
            return cb();
          }
        },
        (cb) => {
          if (payload.allergy_ids || payload.food_type_ids) {
            Item.find(
              { sub_category_id: subCategoryId, is_removed: false },
              (findError, findResult) => {
                if (findError) {
                  return cb(findError);
                }
                if (_.isEmpty(findResult)) {
                  //do nothing
                  return cb();
                }
                return cb(null, findResult);
              }
            );
          } else {
            return cb();
          }
        },
      ],
      (parallelErr, parallelResult) => {
        if (parallelErr) {
          return next(parallelErr);
        }
        let subCategoryRecord = parallelResult[0];
        let itemRecords = parallelResult[4];
        async.autoInject(
          {
            updateItem: (cb) => {
              if (
                (payload.allergy_ids || payload.food_type_ids) &&
                itemRecords && itemRecords.length
              ) {
                let allergyDifference = [],
                  foodTypeDifference = [];
                if (payload.allergy_ids) {
                  allergyDifference = payload.allergy_ids.filter(
                    (x) => !subCategoryRecord.allergy_ids.includes(x)
                  );
                }
                if (payload.food_type_ids) {
                  foodTypeDifference = payload.food_type_ids.filter(
                    (x) => !subCategoryRecord.food_type_ids.includes(x)
                  );
                  console.log(foodTypeDifference);
                }
                if (allergyDifference.length || foodTypeDifference.length) {
                  let itemToUpdate = [];
                  for (let itemObj of itemRecords) {
                    if (allergyDifference.length) {
                      if (
                        !itemObj.filters ||
                        !itemObj.filters.hasOwnProperty("allergies")
                      ) {
                        itemObj.filters = {
                          ...itemObj.filters,
                          allergies: {},
                        };
                      }
                      let difference = allergyDifference.filter(
                        (x) => !itemObj.filters.allergies.includes(x)
                      );
                      if (difference.length) {
                        itemObj.filters = {
                          ...itemObj.filters,
                          allergies:
                            itemObj.filters.allergies.concat(difference),
                        };
                      }
                    }
                    if (foodTypeDifference.length) {
                      let foodDiff = foodTypeDifference.filter(
                        (x) => !itemObj.food_type_ids.includes(x)
                      );
                      if (foodDiff.length) {
                        itemObj.food_type_ids =
                          itemObj.food_type_ids.concat(foodDiff);
                      }
                    }
                    itemToUpdate.push({
                      filters: itemObj.filters,
                      food_type_ids: itemObj.food_type_ids,
                      _id: itemObj._id,
                    });
                  }
                  for (let obj of itemToUpdate) {
                    Item.updateOne(
                      { _id: obj._id },
                      {
                        filters: obj.filters,
                        food_type_ids: obj.food_type_ids,
                      },
                      (updateError, updateResult) => {
                        if (updateError) {
                          let runtimeError = new RuntimeError(
                            "There was an error while updating all items belongs to sub-category",
                            categoryFindError
                          );
                          return cb(runtimeError);
                        }
                      }
                    );
                  }
                }
                return cb();
              } else {
                return cb();
              }
            },
            saveSubCategory: (cb) => {
              subCategoryRecord.name = payload.name
                ? payload.name
                : subCategoryRecord.name;
              subCategoryRecord.panel_type = payload.panel_type
                ? payload.panel_type
                : subCategoryRecord.panel_type;
              subCategoryRecord.order = payload.order
                ? payload.order
                : subCategoryRecord.order;
              subCategoryRecord.category_id = payload.category_id
                ? payload.category_id
                : subCategoryRecord.category_id;
              subCategoryRecord.description = payload.description
                ? payload.description
                : subCategoryRecord.description;
              subCategoryRecord.allergy_ids = payload.allergy_ids
                ? payload.allergy_ids
                : subCategoryRecord.allergy_ids;
              subCategoryRecord.food_type_ids = payload.food_type_ids
                ? payload.food_type_ids
                : subCategoryRecord.food_type_ids;
              subCategoryRecord.is_web =
                payload.is_web != undefined
                  ? payload.is_web
                  : subCategoryRecord.is_web;
              subCategoryRecord.is_tw =
                payload.is_tw != undefined
                  ? payload.is_tw
                  : subCategoryRecord.is_tw;
              subCategoryRecord.is_discount_applied =
                payload.is_discount_applied != undefined
                  ? payload.is_discount_applied
                  : subCategoryRecord.is_discount_applied;
              subCategoryRecord.is_deleted =
                payload.is_deleted != undefined
                  ? payload.is_deleted
                  : subCategoryRecord.is_deleted;
              subCategoryRecord.save(
                (updateSubCategoryError, updatedRecord) => {
                  if (updateSubCategoryError) {
                    let runtimeErrorObj = new RuntimeError(
                      "There was an error while updating sub-category with id " +
                        subCategoryId,
                      updateSubCategoryError
                    );
                    return cb(runtimeError);
                  }
                  return cb(null, updatedRecord);
                }
              );
            },
          },
          (autoInjectError, result) => {
            if (autoInjectError) {
              return next(autoInjectError);
            }
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(JSON.stringify(result.saveSubCategory));
          }
        );
      }
    );
  }

  /**
   * Creates bulk of sub-category
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  bulkCreateSubCategory(req, res, next) {
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
      let dataList = [];
      dataList = _.map(list, (obj) => {
        obj.created_by = userId;
        max += 1;
        return _.pick(obj, [
          "category_id",
          "name",
          "description",
          "is_deleted",
          "created_by",
          "order",
          "is_web",
          "allergy_ids",
          "food_type_ids",
          "is_tw",
          "is_discount_applied",
          "panel_type",
        ]);
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
      SubCategory.insertMany(dataList, (saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while creating bulk of sub-category",
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
   * Move sub-category
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  moveSubCategory(swaggerParams, res, next) {
    let subCategory = swaggerParams.subCategory.value;
    let startIndex = parseInt(subCategory.start_index);
    let endIndex = parseInt(subCategory.end_index);
    async.parallel(
      [
        (cb) => {
          if (startIndex > endIndex) {
            SubCategory.updateMany(
              {
                order: {
                  $gte: startIndex < endIndex ? startIndex : endIndex,
                  $lte: startIndex > endIndex ? startIndex : endIndex,
                },
                _id: { $ne: subCategory.start_index_id },
                panel_type: subCategory.panel_type,
              },
              { $inc: { order: 1 } },
              (updateError) => {
                if (updateError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while updating descending sub-category sorting",
                    updateError
                  );
                  return cb(runtimeError);
                }
                return cb();
              }
            );
          } else {
            SubCategory.updateMany(
              {
                order: {
                  $gte: startIndex < endIndex ? startIndex : endIndex,
                  $lte: startIndex > endIndex ? startIndex : endIndex,
                },
                _id: { $ne: subCategory.start_index_id },
                panel_type: subCategory.panel_type,
              },
              { $inc: { order: -1 } },
              (updateError) => {
                if (updateError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while updating ascending sub-category sorting",
                    updateError
                  );
                  return cb(runtimeError);
                }
                return cb();
              }
            );
          }
        },
        (cb) => {
          SubCategory.updateOne(
            {
              _id: subCategory.start_index_id,
              panel_type: subCategory.panel_type,
            },
            { $set: { order: endIndex } },
            (updateError) => {
              if (updateError) {
                let runtimeError = new RuntimeError(
                  "There was an error while updating sub-category sorting",
                  updateError
                );
                return cb(runtimeError);
              }
              return cb();
            }
          );
        },
      ],
      (parallelError) => {
        if (parallelError) {
          return next(parallelError);
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ msg: "Sorting updated successfully" }));
      }
    );
  }
}

/**
 * Checks for subCategory existence
 *
 * @param {Object} query - The query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function checkCategory(query, callback) {
  Category.findOne(query, (categoryFindError, categoryRecord) => {
    if (categoryFindError) {
      let runtimeError = new RuntimeError(
        "There was an error while fetching category with id " + categoryId,
        categoryFindError
      );
      return callback(runtimeError);
    }
    if (_.isEmpty(categoryRecord)) {
      let validationErrorObj = new ValidationError(
        "The category with id " + query._id + " does not exists"
      );
      return callback(validationErrorObj);
    }
    return callback(null, categoryRecord);
  });
}

/**
 * Checks for sub-category existence
 *
 * @param {Object} query - The sub-category findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function checkSubCategory(query, callback) {
  SubCategory.findOne(query, (subCategoryFindError, subCategoryFindRecord) => {
    if (subCategoryFindError) {
      let runtimeError = new RuntimeError(
        "There was an error while finding sub-category with id " + query._id,
        subCategoryFindError
      );
      return callback(runtimeError);
    }
    if (_.isEmpty(subCategoryFindRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The sub-category with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    callback(null, subCategoryFindRecord);
  });
}

/**
 * Checks for max sub-category order
 *
 * @param {Object} query - The sub-category findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function checkSubCategoryMaxOrder(query, callback) {
  SubCategory.find(query)
    .select("order")
    .sort({ order: -1 })
    .limit(1)
    .exec((findError, findRecord) => {
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while finding sub-category",
          findError
        );
        return callback(runtimeError);
      }
      let max = 0;
      if (findRecord.length) {
        max = findRecord[0].order || 0;
      }
      callback(null, max);
    });
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
  FoodType.findOne(query)
    .select("name")
    .exec((findOneError, findRecord) => {
      if (findOneError) {
        let runtimeErrorObj = new RuntimeError(
          "There was an error while finding food type",
          findOneError
        );
        return callback(runtimeErrorObj);
      }
      if (_.isEmpty(findRecord)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The food type with id " + query._id + " does not exists"
        );
        return callback(resourceNotFoundOErrorObj);
      }
      return callback(null, findRecord.name);
    });
}

module.exports = SubCategoryService;
