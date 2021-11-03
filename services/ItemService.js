"use strict";

const fs = require("fs");
const _ = require("lodash");
const XLSX = require("xlsx");
const path = require("path");
const config = require("config");
const async = require("async");
const { Readable } = require("stream");
const autocorrect = require("autocorrect")();
const { ObjectId } = require("mongoose").Types;
const appDir = path.dirname(require.main.filename);
const { uploadS3 } = require("../helpers/AWSHelper");

const {
  Category,
  SubCategory,
  FoodType,
  Item,
  Option,
  OptionAttribute,
} = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  RuntimeError,
  ValidationError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of item service
 */
class ItemService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new item
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createItem(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let item = req.swagger.params.item.value;
    let categoryId = item.category_id;
    let subCategoryId = item.sub_category_id;
    let foodTypeIds = item.food_type_ids;
    foodTypeIds = _.map(foodTypeIds, (id) => {
      return id.replace(/['"]+/g, "");
    });

    async.parallel(
      [
        (cb) => {
          if (categoryId) {
            CheckCategory({ _id: categoryId }, cb);
          } else {
            return cb();
          }
        },
        (cb) => {
          if (subCategoryId) {
            CheckSubCategory({ _id: subCategoryId }, cb);
          } else {
            return cb();
          }
        },
        (cb) => {
          if (foodTypeIds) {
            async.eachLimit(
              foodTypeIds,
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
          checkItemMaxOrder({}, cb);
        },
      ],
      (parallelError, parallelResult) => {
        if (parallelError) {
          return next(parallelError);
        }
        let max = parallelResult[3];
        let itemDetails = new Item({
          _id: new ObjectId(),
          name: item.name,
          category_id: categoryId,
          sub_category_id: subCategoryId,
          panel_type: item.panel_type,
          filters: item.filters,
          food_type_ids: foodTypeIds,
          created_by: userId,
          item_images: [""],
          description: item.description,
          online_price: item.online_price,
          table_price: item.table_price,
          tw_price: item.tw_price,
          is_web: item.is_web,
          is_tw: item.is_tw,
          is_discount_applied: item.is_discount_applied,
          auto_discount: item.auto_discount,
          is_deleted: false,
          is_removed: false,
          buy_one_get_one: item.buy_one_get_one,
          half_price: item.half_price,
          is_added_to_cart: item.is_added_to_cart,
          is_promoted: item.is_promoted,
          has_tax: item.has_tax,
          options: item.options,
          order: max + 1,
        });

        itemDetails.save((saveError, saveItem) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              "There was an error while creating a new item",
              saveError
            );
            return next(runtimeError);
          }
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 201;
          res.end(JSON.stringify(saveItem));
        });
      }
    );
  }

  /**
   * Gets list of items
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getItemList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let limit = QueryHelper.getItemsPerPage(swaggerParams);
    let keyword = query.keyword;
    if (keyword) {
      query.$or = [
        { name: { $regex: new RegExp(".*" + keyword + ".*", "i") } },
        { description: { $regex: new RegExp(".*" + keyword + ".*", "i") } },
        { name: autocorrect(keyword) },
        { description: autocorrect(keyword) },
      ];
      delete query.keyword;
    }
    if (query.food_type_ids) {
      query.food_type_ids = { $in: [query.food_type_ids] };
    }
    let filterTypes, isAllergy;
    if (query.filter_type_ids || query.is_allergy) {
      filterTypes = query.filter_type_ids["$in"];
      delete query.filter_type_ids;
      if (query.is_allergy) {
        isAllergy = query.is_allergy;
        delete query.is_allergy;
      }
    }
    query.is_removed = false;
    async.parallel(
      [
        (cb) => {
          _getItemCount(query, (countError, countResult) => {
            if (countError) {
              return cb(countError);
            }
            return cb(null, countResult);
          });
        },
        (cb) => {
          Item.find(query)
            .skip(QueryHelper.getSkipValue(swaggerParams, limit))
            .sort({ order: 1 })
            .limit(limit)
            .exec((itemFindError, itemRecords) => {
              if (itemFindError) {
                let runtimeError = new RuntimeError(
                  "There was an error while fetching all items",
                  itemFindError
                );
                return cb(runtimeError);
              }
              if (_.isEmpty(itemRecords)) {
                itemRecords = [];
              }
              return cb(null, itemRecords);
            });
        },
      ],
      (parallelError, parallelResult) => {
        if (parallelError) {
          return next(parallelError);
        }
        let count = parallelResult[0];
        let itemRecords = parallelResult[1];
        let filteredItems = itemRecords;
        if (filterTypes) {
          filteredItems = [];
          for (let item of itemRecords) {
            let filter = item.filters;
            if (!_.isUndefined(filter)) {
              let ary = Object.values(filter);
              ary = [].concat.apply([], ary);
              if (isAllergy) {
                let common = _.intersection(ary, filterTypes);
                if (!common.length) {
                  filteredItems.push(item);
                }
              } else {
                if (ary.some((item) => filterTypes.includes(item))) {
                  filteredItems.push(item);
                }
              }
            } else {
              if (isAllergy) {
                filteredItems.push(item);
              }
            }
          }
          count = filteredItems.length;
        }
        let itemAry = [];
        async.eachLimit(
          itemRecords,
          5,
          (itemObj, eachItemCb) => {
            itemObj = itemObj.toObject();
            let options = _.map(itemObj.options, (id) => ObjectId(id));
            GetOptions({ _id: { $in: options } }, (fetchError, optionData) => {
              if (fetchError) {
                return eachItemCb(fetchError);
              }
              if (_.isEmpty(optionData)) {
                itemObj.options = [];
                itemAry.push(itemObj);
                return eachItemCb();
              }

              let optionAry = [];
              async.eachLimit(
                optionData,
                5,
                (optionObj, eachAttributeCb) => {
                  GetAttributes(
                    { option_id: optionObj._id },
                    (fetchError, attributeData) => {
                      if (fetchError) {
                        return eachAttributeCb(fetchError);
                      }
                      optionObj = optionObj.toObject();
                      optionObj.attributes = attributeData;
                      optionAry.push(optionObj);
                      itemObj.options = optionAry;
                      return eachAttributeCb();
                    }
                  );
                },
                (eachError) => {
                  if (eachError) {
                    return eachItemCb(eachError);
                  }
                  itemAry.push(itemObj);
                  return eachItemCb();
                }
              );
            });
          },
          (eachError) => {
            if (eachError) {
              return next(eachError);
            }
            res.statusCode = 200;
            res.setHeader("access-control-expose-headers", "x-result-count");
            res.setHeader("x-result-count", count);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(itemAry));
          }
        );
      }
    );
  }

  /**
   * Gets item details of given item_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getItem(swaggerParams, res, next) {
    let itemId = swaggerParams.item_id.value;
    CheckItem({ _id: itemId }, (itemCheckError, itemCheckResult) => {
      if (itemCheckError) {
        return next(itemCheckError);
      }
      async.parallel(
        [
          (cb) => {
            if (itemCheckResult.category_id) {
              CheckCategory({ _id: itemCheckResult.category_id }, cb);
            } else {
              return cb();
            }
          },
          (cb) => {
            if (itemCheckResult.sub_category_id) {
              CheckSubCategory({ _id: itemCheckResult.sub_category_id }, cb);
            } else {
              return cb();
            }
          },
          // (cb) => {
          //   Allergy.find({ _id: { $in: itemCheckResult.allergy_ids } })
          //     .select("name")
          //     .exec((findError, findRecords) => {
          //       if (findError) {
          //         let runtimeErrorObj = new RuntimeError(
          //           "There was an error while finding allergy",
          //           findError
          //         );
          //         return cb(runtimeErrorObj);
          //       }
          //       if (_.isEmpty(findRecords)) {
          //         return cb(null, []);
          //       }
          //       return cb(null, findRecords);
          //     });
          // },
          // (cb) => {
          //   CheckSpice({ _id: itemCheckResult.spice_id }, cb);
          // },
          // (cb) => {
          //   CheckCalorie({ _id: itemCheckResult.calorie_id }, cb);
          // },
          (cb) => {
            FoodType.find({ _id: { $in: itemCheckResult.food_type_ids } })
              .select("name")
              .exec((findError, findRecords) => {
                if (findError) {
                  let runtimeErrorObj = new RuntimeError(
                    "There was an error while finding food type",
                    findError
                  );
                  return cb(runtimeErrorObj);
                }
                if (_.isEmpty(findRecords)) {
                  return cb(null, []);
                }
                return cb(null, findRecords);
              });
          },
        ],
        (parallelError, parallelResult) => {
          if (parallelError) {
            return next(parallelError);
          }
          itemCheckResult = itemCheckResult.toObject();
          itemCheckResult.category = parallelResult[0] ? parallelResult[0].name : '';
          itemCheckResult.sub_category = parallelResult[1] ? parallelResult[1].name : '';
          // itemCheckResult.allergy = parallelResult[2];
          // itemCheckResult.spice = parallelResult[3];
          // itemCheckResult.calorie = parallelResult[4];
          itemCheckResult.food_type = parallelResult[5];
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(itemCheckResult));
        }
      );
    });
  }

  /**
   * Updates item details of given item_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateItem(swaggerParams, res, next) {
    let itemId = swaggerParams.item_id.value;
    let payload = swaggerParams.item.value;

    async.parallel(
      [
        (cb) => {
          if (itemId) {
            CheckItem({ _id: itemId }, cb);
          } else {
            return cb();
          }
        },
        (cb) => {
          if (payload.category_id) {
            CheckCategory(
              { _id: payload.category_id },
              (checkError, checkResult) => {
                if (checkError) {
                  return cb(checkError);
                }
                return cb(null, checkResult);
              }
            );
          } else {
            return cb();
          }
        },
        (cb) => {
          if (payload.sub_category_id) {
            CheckSubCategory(
              { _id: payload.sub_category_id },
              (checkError, checkResult) => {
                if (checkError) {
                  return cb(checkError);
                }
                return cb(null, checkResult);
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
      ],
      (parallelErr, parallelResult) => {
        if (parallelErr) {
          return next(parallelErr);
        }
        let itemRecord = parallelResult[0];

        if (payload.category_id || payload.sub_category_id) {
          if (
            !itemRecord.filters ||
            !itemRecord.filters.hasOwnProperty("allergies")
          ) {
            itemRecord.filters = {
              ...itemRecord.filters,
              allergies: {},
            };
          }
          if (payload.category_id) {
            itemRecord.filters = {
              ...itemRecord.filters,
              allergies: itemRecord.filters.allergies.concat(
                parallelResult[1].allergy_ids
              ),
            };
            let difference = parallelResult[1].food_type_ids.filter(
              (x) => !itemRecord.food_type_ids.includes(x)
            );
            itemRecord.food_type_ids = [
              ...itemRecord.food_type_ids,
              difference,
            ];
          }
          if (payload.sub_category_id) {
            itemRecord.filters = {
              ...itemRecord.filters,
              allergies: itemRecord.filters.allergies.concat(
                parallelResult[2].allergy_ids
              ),
            };
            let difference = parallelResult[2].food_type_ids.filter(
              (x) => !itemRecord.food_type_ids.includes(x)
            );
            itemRecord.food_type_ids = [
              ...itemRecord.food_type_ids,
              difference,
            ];
          }
          itemRecord.filters.allergies = [
            ...new Set(itemRecord.filters.allergies.map(String)),
          ];
        }
        itemRecord.name = payload.name ? payload.name : itemRecord.name;
        itemRecord.category_id = payload.category_id
          ? payload.category_id
          : itemRecord.category_id;
        itemRecord.sub_category_id = payload.sub_category_id
          ? payload.sub_category_id
          : itemRecord.sub_category_id;
        itemRecord.panel_type = payload.panel_type
          ? payload.panel_type
          : itemRecord.panel_type;
        itemRecord.filters = payload.filters
          ? payload.filters
          : itemRecord.filters;
        itemRecord.food_type_ids = payload.food_type_ids
          ? payload.food_type_ids
          : itemRecord.food_type_ids;
        itemRecord.description = payload.description
          ? payload.description
          : itemRecord.description;
        itemRecord.online_price = payload.online_price
          ? payload.online_price
          : itemRecord.online_price;
        itemRecord.table_price = payload.table_price
          ? payload.table_price
          : itemRecord.table_price;
        itemRecord.tw_price = payload.tw_price
          ? payload.tw_price
          : itemRecord.tw_price;
        itemRecord.is_web =
          payload.is_web != undefined ? payload.is_web : itemRecord.is_web;
        itemRecord.is_tw =
          payload.is_tw != undefined ? payload.is_tw : itemRecord.is_tw;
        itemRecord.is_discount_applied =
          payload.is_discount_applied != undefined
            ? payload.is_discount_applied
            : itemRecord.is_discount_applied;
        itemRecord.auto_discount =
          payload.auto_discount != undefined
            ? payload.auto_discount
            : itemRecord.auto_discount;
        itemRecord.is_deleted =
          payload.is_deleted != undefined
            ? payload.is_deleted
            : itemRecord.is_deleted;
        itemRecord.is_removed =
          payload.is_removed != undefined
            ? payload.is_removed
            : itemRecord.is_removed;
        itemRecord.buy_one_get_one = payload.buy_one_get_one
          ? payload.buy_one_get_one
          : itemRecord.buy_one_get_one;
        itemRecord.half_price = payload.half_price
          ? payload.half_price
          : itemRecord.half_price;
        itemRecord.is_added_to_cart = payload.is_added_to_cart
          ? payload.is_added_to_cart
          : itemRecord.is_added_to_cart;
        itemRecord.is_promoted = payload.is_promoted
          ? payload.is_promoted
          : itemRecord.is_promoted;  
        itemRecord.has_tax = payload.has_tax
          ? payload.has_tax
          : itemRecord.has_tax;
        itemRecord.options = payload.options
          ? payload.options
          : itemRecord.options;
        itemRecord.order = payload.order ? payload.order : itemRecord.order;
        itemRecord.save((updateItemError, updatedRecord) => {
          if (updateItemError) {
            let runtimeErrorObj = new RuntimeError(
              "There was an error while updating item with id " + subCategoryId,
              updateItemError
            );
            return next(runtimeErrorObj);
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(updatedRecord));
        });
      }
    );
  }

  /**
   * Creates bulk of item
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  bulkCreateItem(req, res, next) {
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
          "name",
          "category_id",
          "sub_category_id",
          "panel_type",
          "filters",
          "food_type_ids",
          "description",
          "online_price",
          "table_price",
          "tw_price",
          "is_web",
          "is_tw",
          "is_discount_applied",
          "auto_discount",
          "is_removed",
          "buy_one_get_one",
          "half_price",
          'is_added_to_cart',
          "has_tax",
          "options",
          "is_deleted",
          "created_by",
          "order",
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
      Item.insertMany(dataList, (saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while creating bulk of item",
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
   * Move item
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  moveItem(swaggerParams, res, next) {
    let item = swaggerParams.item.value;
    let startIndex = parseInt(item.start_index);
    let endIndex = parseInt(item.end_index);
    async.parallel(
      [
        (cb) => {
          if (startIndex > endIndex) {
            Item.updateMany(
              {
                order: {
                  $gte: startIndex < endIndex ? startIndex : endIndex,
                  $lte: startIndex > endIndex ? startIndex : endIndex,
                },
                _id: { $ne: item.start_index_id },
              },
              { $inc: { order: 1 } },
              (updateError) => {
                if (updateError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while updating descending item sorting",
                    updateError
                  );
                  return cb(runtimeError);
                }
                return cb();
              }
            );
          } else {
            Item.updateMany(
              {
                order: {
                  $gte: startIndex < endIndex ? startIndex : endIndex,
                  $lte: startIndex > endIndex ? startIndex : endIndex,
                },
                _id: { $ne: item.start_index_id },
              },
              { $inc: { order: -1 } },
              (updateError) => {
                if (updateError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while updating ascending item sorting",
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
          Item.updateOne(
            { _id: item.start_index_id },
            { $set: { order: endIndex } },
            (updateError) => {
              if (updateError) {
                let runtimeError = new RuntimeError(
                  "There was an error while updating item sorting",
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

  /**
   * Upload item-images in item with given item_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  uploadImages(swaggerParams, res, next) {
    let item = swaggerParams;
    let itemId = swaggerParams.item_id.value;
    let maxImageLimit = config.get('item_image_count');
    CheckItem({_id: itemId, is_deleted: false}, (itemCheckError, itemRecord) => {
      if (itemCheckError) {
        return next(itemCheckError);
      }
      if (itemRecord.item_images.length >= maxImageLimit) {
        let validationError = new ValidationError(
          'You can not add more images for item ' + itemId
        );
        return next(validationError);
      }
      let uploadingFiles = [];
      async.autoInject({
        uploadFile: (cb) => {
          let maxSize = config.get('aws.file_size.item_image');

          for (let i = 1; i <= maxImageLimit; i++) {
            let file = item['item_img_' + i].value;
            if (!_.isEmpty(file)) {
              if (file.size > maxSize) {
                let validationError = new ValidationError(
                  'The file with name ' + file.originalname + ' should be less than ' + (maxSize / 1024) + ' KB'
                );
                return cb(validationError);
              }
              uploadingFiles.push(file);
            }
          }
          _uploadToS3(uploadingFiles, itemId, (uploadError, uploadFile) => {
            if (uploadError) {
              return cb(uploadError);
            }
            cb(null, uploadFile);
          });
        },
        saveItem: (uploadFile, cb) => {
          if (itemRecord.item_images.length > 0) {
          itemRecord.item_images = itemRecord.item_images.concat(uploadFile);  
          } else {
            itemRecord.item_images = uploadFile;
          }
          itemRecord.save((saveError, saveItem) => {
            if (saveError) {
              let runtimeError = new RuntimeError(
                'There was an error while adding a new item-image',
                saveError
              );
              return cb(runtimeError);
            }
            cb(null, saveItem);
          });
        }
      }, (autoInjectError, results) => {
        if (autoInjectError) {
          return next(autoInjectError);
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(results.saveItem));
      });
    });
  }
}

/**
 * Checks for category existence
 *
 * @param {Object} query - The query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckCategory(query, callback) {
  Category.findOne(query).exec((categoryFindError, findRecord) => {
    if (categoryFindError) {
      let runtimeError = new RuntimeError(
        "There was an error while fetching category with id " + query._id,
        categoryFindError
      );
      return callback(runtimeError);
    }
    if (_.isEmpty(findRecord)) {
      let validationErrorObj = new ValidationError(
        "The category with id " + query._id + " does not exists"
      );
      return callback(validationErrorObj);
    }
    if (findRecord.is_deleted) {
      let validationError = new ValidationError("The category is disabled");
      return callback(validationError);
    }
    return callback(null, findRecord);
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
function CheckSubCategory(query, callback) {
  SubCategory.findOne(query).exec((subCategoryFindError, findRecord) => {
    if (subCategoryFindError) {
      let runtimeError = new RuntimeError(
        "There was an error while finding sub-category with id " + query._id,
        subCategoryFindError
      );
      return callback(runtimeError);
    }
    if (_.isEmpty(findRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The sub-category with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    if (findRecord.is_deleted) {
      let validationError = new ValidationError("The sub-category is disabled");
      return callback(validationError);
    }
    return callback(null, findRecord);
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
 * Checks for item existence
 *
 * @param {Object} query - The item findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckItem(query, callback) {
  Item.findOne(query, (findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding item",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The item with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    return callback(null, findRecord);
  });
}

/**
 * Gets the count of item data that matches a given query
 *
 * @param {object} query - The query for the database call
 * @param {function} callback - The callback
 *
 *
 * @private
 *
 */
function _getItemCount(query, callback) {
  Item.count(query, function countResults(countError, countResult) {
    if (countError) {
      let runTimeError = new RuntimeError(
        "An error occurred while counting item records",
        countError
      );
      return callback(runTimeError);
    }
    return callback(null, countResult);
  });
}

/**
 * Checks for max item order
 *
 * @param {Object} query - The item find query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function checkItemMaxOrder(query, callback) {
  Item.find(query)
    .select("order")
    .sort({ order: -1 })
    .limit(1)
    .exec((findError, findRecord) => {
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while finding item",
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
 * Gets for options list
 *
 * @param {Object} query - The options find query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function GetOptions(query, callback) {
  Option.find(query).exec((findOneError, findRecords) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding options",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecords)) {
      findRecords = [];
    }
    return callback(null, findRecords);
  });
}

/**
 * Gets for attribute list
 *
 * @param {Object} query - The attributes find query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function GetAttributes(query, callback) {
  OptionAttribute.find(query).exec((findOneError, findRecords) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding option attributes",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecords)) {
      findRecords = [];
    }
    return callback(null, findRecords);
  });
}

/**
 * Handles the multiple file upload to S3
 *
 * @param {Array} files - The files array that should be uploaded to S3
 * @param {String} itemId - The item id
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
 function _uploadToS3(files, itemId, callback) {
  let itemImages = [];
  async.eachSeries(files, (uploadingFile, eachFileCb) => {
    let extention = uploadingFile.originalname.split('.').pop();
    let fileName = new Date().getTime() + '.' + extention;
    let awsFileLocation = 'items/' + itemId + '/' + fileName;
    let params = {
      Key: awsFileLocation,
      Body: uploadingFile.buffer,
      ContentType: uploadingFile.mimetype
    };
    uploadS3(params, (uploadError, uploadResult) => {
      if (uploadError) {
        return eachFileCb(uploadError);
      }
      itemImages.push(uploadResult.Location);
      return eachFileCb();
    });
  }, (eachError) => {
    if (eachError) {
      return callback(eachError);
    }
    return callback(null, itemImages);
  });
}

module.exports = ItemService;
