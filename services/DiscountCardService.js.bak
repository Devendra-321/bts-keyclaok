"use strict";

const _ = require("lodash");
const config = require("config");
const async = require("async");
const { DiscountCard } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");
const { uploadS3 } = require("../helpers/AWSHelper");

/**
 * Creates an instance of discount card service
 */
class DiscountCardService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new discount card
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createDiscountCard(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let discount = req.swagger.params.discount.value;
    let discountDetails = new DiscountCard({
      name: discount.name,
      image: discount.image,
      code: discount.code,
      price: discount.price,
      amount: discount.amount,
      discount: discount.discount,
      type: discount.type,
      card_type: discount.card_type,
      min_order_value: discount.min_order_value,
      expiry_date: discount.expiry_date,
      expiry_day: discount.expiry_day,
      created_by: userId,
      is_deleted: discount.is_deleted,
      is_removed: discount.is_removed,
    });
    discountDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new discount card",
          saveError
        );
        return next(runtimeError);
      }
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 201;
      res.end(JSON.stringify(saveRecord));
    });
  }

  /**
   * Get all discount cards
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDiscountCardList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    query.is_removed = false;
    DiscountCard.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all discount cards",
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
   * Get discount card with given discount_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDiscountCard(swaggerParams, res, next) {
    let discountId = swaggerParams.discount_id.value;
    CheckDiscountCard(
      { _id: discountId },
      (checkError, checkResult) => {
        if (checkError) {
          return next(checkError);
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(checkResult));
      }
    );
  }

  /**
   *  Update discount card with given discount_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateDiscountCard(swaggerParams, res, next) {
    let discountId = swaggerParams.discount_id.value;
    let discount = swaggerParams.discount.value;
    CheckDiscountCard({ _id: discountId }, (checkError, discountRecord) => {
      if (checkError) {
        return next(checkError);
      }
      discountRecord.name = discount.name ? discount.name : discountRecord.name;
      discountRecord.image = discount.image ? discount.image : discountRecord.image;
      discountRecord.code = discount.code ? discount.code : discountRecord.code;
      discountRecord.price = discount.price ? discount.price : discountRecord.price;
      discountRecord.amount = discount.amount ? discount.amount : discountRecord.amount;
      discountRecord.discount = discount.discount ? discount.discount : discountRecord.discount;
      discountRecord.type = discount.type ? discount.type : discountRecord.type;
      discountRecord.card_type = discount.card_type ? discount.card_type : discountRecord.card_type;
      discountRecord.min_order_value = discount.min_order_value ? discount.min_order_value : discountRecord.min_order_value;
      discountRecord.expiry_date = discount.expiry_date ? discount.expiry_date : discountRecord.expiry_date;
      discountRecord.expiry_day = discount.expiry_day ? discount.expiry_day : discountRecord.expiry_day;
      discountRecord.is_deleted = discount.is_deleted != undefined ? discount.is_deleted : discountRecord.is_deleted;
      discountRecord.is_removed = discount.is_removed != undefined ? discount.is_removed : discountRecord.is_removed;
      discountRecord.save((saveError, saveDiscount) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a discount card",
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(saveDiscount));
      });
    });
  }

  /**
   * Upload card-image with given card_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   uploadCardImage(swaggerParams, res, next) {
    let file = swaggerParams.item_img_1.value;
    let discountId = swaggerParams.discount_id.value;
    CheckDiscountCard({ _id: discountId, is_deleted: false }, (checkError, discountRecord) => {
      if (checkError) {
        return next(checkError);
      }
      async.autoInject({
        uploadFile: (cb) => {
          let maxSize = config.get('aws.file_size.card_image');
          if (file.size > maxSize) {
            let validationError = new ValidationError(
              'The file with name ' + file.originalname + ' should be less than ' + (maxSize / 1024) + ' KB'
            );
            return cb(validationError);
          }
          _uploadFileToS3(file, discountId, (uploadError, uploadFile) => {
            if (uploadError) {
              return next(uploadError);
            }
            cb(null, uploadFile);
          });
        },
        saveCard: (uploadFile, cb) => {
          discountRecord.image = uploadFile.Location;
          discountRecord.save((saveError, saveCard) => {
            if (saveError) {
              let runtimeError = new RuntimeError(
                'There was an error while adding/updating discount card image',
                saveError
              );
              return cb(runtimeError);
            }
            cb(null, saveCard);
          });
        }
      }, (autoInjectError, results) => {
        if (autoInjectError) {
          return next(autoInjectError);
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(results.saveCard));
      });
    });
  }
}

/**
 * Checks for discount existence
 *
 * @param {Object} query - The discount findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckDiscountCard(query, callback) {
  DiscountCard.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding discount card",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The discount with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    return callback(null, findRecord);
  });
}

/**
 * Handles the file upload to S3
 *
 * @param {String} file - The file to upload
 * @param {String} cardId - The cardId to upload file
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
 function _uploadFileToS3(file, cardId, callback) {
  let extention = file.originalname.split('.').pop();
  let fileName = new Date().getTime() + '.' + extention;
  let awsFileLocation = 'cards/' + cardId + '/' + fileName;
  let params = {
    Key: awsFileLocation,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  uploadS3(params, callback);
}

module.exports = DiscountCardService;
