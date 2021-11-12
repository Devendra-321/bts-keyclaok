'use strict';

const fs = require('fs');
const _ = require("lodash");
const XLSX = require("xlsx");
const path = require("path");
const async = require('async');
const { Readable } = require('stream');
const { Category, FoodType, Item } = require('../models');
const { QueryHelper } = require('../helpers/bts-query-utils');
const { ValidationError, RuntimeError, ResourceNotFoundError } = require('../helpers/bts-error-utils');
const JWT = require('jsonwebtoken');
const appDir = path.dirname(require.main.filename);

/**
 * Creates an instance of category service
 */
class CategoryService {

  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new category
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createCategory(req, res, next) {
    let userId = JWT.decode(req.headers['x-request-jwt']).sub; //req.authentication.jwt.payload.user_id;
    let category = req.swagger.params.category.value;
    async.parallel(
      [
        (cb) => {
          CheckCategory({name: { $regex: new RegExp("^" + category.name, "i") }}, (categoryCheckError, categoryCheckResult) => {
            if (categoryCheckError) {
              return cb(categoryCheckError);
            }
            if (!_.isEmpty(categoryCheckResult)) {
              let validationErrorObj = new ValidationError(
                'The category with name ' + category.name + ' already exists'
              );
              return cb(validationErrorObj);
            }
            return cb();
          });
        },
        (cb) => {
          checkCategoryMaxOrder(
            { panel_type: category.panel_type },
            (maxCheckError, maxResult) => {
              if (maxCheckError) {
                return cb(maxCheckError);
              }
              return cb(null, maxResult);
            }
          );
        },
      ], (parallelError, parallelResult) => {
        if (parallelError) {
          return next(parallelError);
        }
        let max = parallelResult[1];
        let categoryDetails = new Category({
          name: category.name,
          description: category.description,
          is_deleted: category.is_deleted,
          created_by: userId,
          is_web: category.is_web,
          allergy_ids: category.allergy_ids,
          food_type_ids: category.food_type_ids,
          is_tw: category.is_tw,
          panel_type: category.panel_type,
          is_discount_applied: category.is_discount_applied,
          order: max + 1
        });
        categoryDetails.save((saveError, saveCategory) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              'There was an error while creating a new category',
              saveError
            );
            return next(runtimeError);
          }
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 201;
          res.end(JSON.stringify(saveCategory));
        });
      });
  }

  /**
   * Get all categories
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getCategoryList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (keyword) {
      query.$or = [
        {name: {$regex: new RegExp('.*' + keyword + '.*', 'i')}},
        {description: {$regex: new RegExp('.*' + keyword + '.*', 'i')}}
      ];
      delete query.keyword;
    }
    if (query.food_type_ids) {
      query.food_type_ids = {$in: [query.food_type_ids]};
    }
    Category.find(query)
    .sort({'order': 1})
    .exec((categoryFindError, categoryRecords) => {
      res.setHeader('Content-Type', 'application/json');
      if (categoryFindError) {
        let runtimeError = new RuntimeError(
          'There was an error while fetching all categories',
          categoryFindError
        );
        return next(runtimeError);
      }
      if (_.isEmpty(categoryRecords)) {
        res.statusCode = 204;
        return res.end();
      }
      res.statusCode = 200;
      res.end(JSON.stringify(categoryRecords));
    });
  }

  /**
   * Gets category details of given category_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getCategory(swaggerParams, res, next) {
    let categoryId = swaggerParams.category_id.value;
    CheckCategory({_id: categoryId}, (categoryCheckError, categoryCheckResult) => {
      if (categoryCheckError) {
        return next(categoryCheckError);
      }
      if (_.isEmpty(categoryCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The category with id " + categoryId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(categoryCheckResult));
    });
  }

  /**
   * Updates category details of given category_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateCategory(swaggerParams, res, next) {
  let categoryId = swaggerParams.category_id.value;
  let category = swaggerParams.category.value;
  async.parallel([
    (cb) => {
      CheckCategory({_id: categoryId}, (categoryCheckError, categoryCheckResult) => {
        if (categoryCheckError) {
          return cb(categoryCheckError);
        }
        if (_.isEmpty(categoryCheckResult)) {
          let resourceNotFoundOErrorObj = new ResourceNotFoundError(
            "The category with id " + categoryId + " does not exists"
          );
          return cb(resourceNotFoundOErrorObj);
        }
        return cb(null, categoryCheckResult);
      });
    },
    (cb) => {
      if (category.name) {
        let categoryName = _.trim(category.name);
        Category.findOne({
          'name': {$regex: new RegExp('^' + categoryName, 'i')},
          _id: {$ne: categoryId}
        }, (categoryNameFindError, categoryNameRecord) => {
          if (categoryNameFindError) {
            let runtimeError = new RuntimeError(
              'There was an error while fetching categories with name ' + categoryName,
              categoryNameFindError
            );
            return cb(runtimeError);
          }
          if (!_.isEmpty(categoryNameRecord)) {
            let validationErrorObj = new ValidationError(
              'The category with category name ' + categoryName + ' already exist in the system'
            );
            return cb(validationErrorObj);
          }
          return cb();
        });
      } else {
        return cb();
      }
    },
    (cb) => {
      if (category.food_type_ids) {
        async.eachLimit(
          category.food_type_ids,
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
      if (category.allergy_ids || category.food_type_ids) {
        Item.find({category_id: categoryId, is_removed: false}, (findError, findResult) => {
          if (findError) {
            return cb(findError);
          }
          if (_.isEmpty(findResult)) {
            //do nothing
            return cb();
          }
          return cb(null, findResult)
        });
      } else {
        return cb();
      }
    }
  ], (parallelError, parallelResult) => {
    if (parallelError) {
      return next(parallelError);
    }
    let categoryRecord = parallelResult[0];
    let itemRecords = parallelResult[3];
    async.autoInject({
      updateItem: (cb) => {
        if ((category.allergy_ids || category.food_type_ids) && itemRecords && itemRecords.length) {
          let allergyDifference = [], foodTypeDifference = [];
            if (category.allergy_ids) {
              allergyDifference = category.allergy_ids.filter(x => !categoryRecord.allergy_ids.includes(x));
            }
            if (category.food_type_ids) {
              foodTypeDifference = category.food_type_ids.filter(x => !categoryRecord.food_type_ids.includes(x));
            }
            if (allergyDifference.length || foodTypeDifference.length) {
              let itemToUpdate = [];
              for (let itemObj of itemRecords) {
                if (allergyDifference.length) {
                  if (!itemObj.filters || !itemObj.filters.hasOwnProperty('allergies')) {
                    itemObj.filters = {
                      ...itemObj.filters,
                      allergies: []
                    }
                  }
                  let difference = allergyDifference.filter(x => !itemObj.filters.allergies.includes(x));
                  if (difference.length) {
                    itemObj.filters = {
                      ...itemObj.filters,
                      allergies: itemObj.filters.allergies.concat(difference)
                    }
                  }
                } 
                if (foodTypeDifference.length) {
                  let foodDiff = foodTypeDifference.filter(x => !itemObj.food_type_ids.includes(x));
                  if (foodDiff.length) {
                    itemObj.food_type_ids = itemObj.food_type_ids.concat(foodDiff);
                  }
                }
                itemToUpdate.push({filters: itemObj.filters, food_type_ids: itemObj.food_type_ids, _id: itemObj._id});
              }
              for (let obj of itemToUpdate) {
                Item.updateOne({_id: obj._id}, {filters: obj.filters, food_type_ids: obj.food_type_ids}, (updateError, updateResult) => {
                  if (updateError) {
                    let runtimeError = new RuntimeError(
                      'There was an error while updating all items belongs to category',
                      categoryFindError
                    );
                    return cb(runtimeError);
                  }
                })
              }
            }
            return cb();
        } else {
          return cb();
        }
      },
      saveCategory: (cb) => {
        categoryRecord.name = category.name ? category.name : categoryRecord.name;
        categoryRecord.panel_type = category.panel_type ? category.panel_type : categoryRecord.panel_type;
        categoryRecord.order = category.order ? category.order : categoryRecord.order;
        categoryRecord.description = category.description ? category.description : categoryRecord.description;
        categoryRecord.allergy_ids = category.allergy_ids ? category.allergy_ids : categoryRecord.allergy_ids;
        categoryRecord.food_type_ids = category.food_type_ids ? category.food_type_ids : categoryRecord.food_type_ids;
        categoryRecord.is_web = category.is_web != undefined ? category.is_web : categoryRecord.is_web;
        categoryRecord.is_tw = category.is_tw != undefined ? category.is_tw : categoryRecord.is_tw;
        categoryRecord.is_discount_applied = category.is_discount_applied != undefined ? category.is_discount_applied : categoryRecord.is_discount_applied;
        categoryRecord.is_deleted = category.is_deleted != undefined ? category.is_deleted : categoryRecord.is_deleted;
        categoryRecord.save((saveError, saveCategory) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              'There was an error while updating a category',
              saveError
            );
            return cb(runtimeError);
          }
          return cb(null, saveCategory);
        });
      }
    }, (autoInjectError, result) => {
      if (autoInjectError) {
        return next(autoInjectError);
      }
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(result.saveCategory));
    });
  });
  }

  /**
   * Creates bulk of category
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  bulkCreateCategory(req, res, next) {
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
      return _.pick(obj, ['name', 'description', 'is_deleted', 'created_by', 'order', 'is_web', 'allergy_ids', 'food_type_ids', 'is_tw', 'is_discount_applied', 'panel_type'])
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
    Category.insertMany(dataList, (saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating bulk of category",
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

  /**
   * Move category
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  moveCategory(swaggerParams, res, next) {
    let category = swaggerParams.category.value;
    let startIndex = parseInt(category.start_index);
    let endIndex = parseInt(category.end_index);
    async.parallel([
      (cb) => {
        if (startIndex > endIndex) {
          Category.updateMany(
            {
              order: {
                $gte: startIndex < endIndex ? startIndex : endIndex,
                $lte: startIndex > endIndex ? startIndex : endIndex,
              },
              _id: { $ne: category.start_index_id },
              panel_type: category.panel_type
            },
            { $inc: { order: 1 } },
            (updateError) => {
              if (updateError) {
                let runtimeError = new RuntimeError(
                  'There was an error while updating descending category sorting',
                  updateError
                );
                return cb(runtimeError);
              }
              return cb();
            }
          );
        } else {
          Category.updateMany(
            {
              order: {
                $gte: startIndex < endIndex ? startIndex : endIndex,
                $lte: startIndex > endIndex ? startIndex : endIndex,
              },
              _id: { $ne: category.start_index_id },
              panel_type: category.panel_type
            },
            { $inc: { order: -1 } },
            (updateError) => {
              if (updateError) {
                let runtimeError = new RuntimeError(
                  'There was an error while updating ascending category sorting',
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
        Category.updateOne({ _id: category.start_index_id, panel_type: category.panel_type }, { $set: { order: endIndex } }, (updateError) => {
          if (updateError) {
            let runtimeError = new RuntimeError(
              'There was an error while updating category sorting',
              updateError
            );
            return cb(runtimeError);
          }
          return cb();
        });
      }
    ], (parallelError) => {
      if (parallelError) {
        return next(parallelError);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({msg: 'Sorting updated successfully'}));
    });
  }
}

/**
 * Checks for category existence
 *
 * @param {Object} query - The user findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckCategory(query, callback) {
  Category.findOne(query)
    .exec((categoryFindOneError, categoryRecord) => {
      if (categoryFindOneError) {
        let runtimeErrorObj = new RuntimeError(
          'There was an error while finding category',
          categoryFindOneError
        );
        return callback(runtimeErrorObj);
      }
      return callback(null, categoryRecord);
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

/**
 * Checks for max category order
 *
 * @param {Object} query - The category findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
 function checkCategoryMaxOrder(query, callback) {
  Category.find(query)
    .select("order")
    .sort({ order: -1 })
    .limit(1)
    .exec((findError, findRecord) => {
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while finding category",
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

module.exports = CategoryService;