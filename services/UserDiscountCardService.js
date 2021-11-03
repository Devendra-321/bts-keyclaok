"use strict";

const _ = require("lodash");
const async = require("async");
const { UserDiscountCard, CheckoutFacility } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of user gift card
 */
class UserDiscountCardService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Purchase a new gift card
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   purchaseGiftCard(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let card = req.swagger.params.card.value;
    let checkoutFacilityDetails = new UserDiscountCard({
      user_id: userId,
      card_id: card.card_id
    });
    checkMaxOrder({}, (checkErr, result) => {
      if (checkErr) {
        return next(checkErr);
      }
      checkoutFacilityDetails.card_number = result + 1;
      checkoutFacilityDetails.save((saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while purchasing a new gift card",
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
   * Get all gift cards
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getGiftCardList(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let query = QueryHelper.getQuery(req.swagger.params);
    // query.is_removed = false;
    query.user_id = userId;
    UserDiscountCard.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all gift cards",
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
   * Get gift card with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getGiftCard(swaggerParams, res, next) {
    let cardId = swaggerParams.discount_id.value;
    CheckGiftCard(
      { _id: cardId },
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
   * Update gift card with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateGiftCard(swaggerParams, res, next) {
    let cardId = swaggerParams.discount_id.value;
    let card = swaggerParams.card.value;
    CheckGiftCard({ _id: cardId }, (checkError, cardRecord) => {
      if (checkError) {
        return next(checkError);
      }
      cardRecord.is_removed = card.is_removed != undefined ? card.is_removed : cardRecord.is_removed;
      cardRecord.save((saveError, saveCard) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a gift card status",
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(saveCard));
      });
    });
  }

   /**
   * Remove gift card with given id from user account
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
    removeGiftCard(swaggerParams, res, next) {
      let cardId = swaggerParams.discount_id.value;
      CheckGiftCard(
        { _id: cardId },
        (checkError, checkResult) => {
          if (checkError) {
            return next(checkError);
          }
          checkResult.remove((removeError, removeCard) => {
            if (removeError) {
              let runtimeError = new RuntimeError(
                'There was an error while removing a gift card',
                removeError
              );
              return cb(runtimeError);
            }
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(removeCard));
          });
        });   
    }
}

/**
 * Checks for user gift card existence
 *
 * @param {Object} query - The user card findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckGiftCard(query, callback) {
  UserDiscountCard.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding user gift card",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The card with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    return callback(null, findRecord);
  });
}

/**
 * Checks for gift card number existence
 *
 * @param {Object} query - The gift card number findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
 function CheckCheckoutFacility(query, callback) {
  CheckoutFacility.findOne(query)
    .select({ _id: 1, type: 1, value: 1 })
    .exec((findOneError, findRecord) => {
      if (findOneError) {
        let runtimeErrorObj = new RuntimeError(
          "There was an error while finding gift card number",
          findOneError
        );
        return callback(runtimeErrorObj);
      }
      if (_.isEmpty(findRecord)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The gift card number with id " + query._id + " does not exists"
        );
        return callback(resourceNotFoundOErrorObj);
      }
      return callback(null, findRecord);
    });
}

/**
 * Checks for max gift card number
 *
 * @param {Object} query - The gift card find query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
 function checkMaxOrder(query, callback) {
  UserDiscountCard.find(query)
    .select("card_number")
    .sort({ card_number: -1 })
    .limit(1)
    .exec((findError, findRecord) => {
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while finding user gift card",
          findError
        );
        return callback(runtimeError);
      }
      if (findRecord.length) {
        let max = findRecord[0].card_number || 0;
        return callback(null, parseInt(max));
      } else {
        CheckCheckoutFacility({ type: "GIFT_CARD_NUMBER" }, (checkErr, result) => {
          if (checkErr) {
            return callback(checkErr);
          }
          return callback(null, result.value);
        });
      }
    });
}

module.exports = UserDiscountCardService;
