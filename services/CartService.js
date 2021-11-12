'use strict';

const fs = require('fs');
const _ = require("lodash");
const async = require("async");
const { Cart, Item } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require("jsonwebtoken");

const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of cart service
 */
class CartService {

  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new cart item
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createCart(req, res, next) {
    let userId = JWT.decode(req.headers['x-request-jwt']).sub;//req.authentication.jwt.payload.user_id;
    let cart = req.swagger.params.cart.value;
    async.parallel([
      (cb) => {
        CheckItem({ _id: cart.item_id, is_deleted: false }, cb);
      },
      (cb) => {
        CheckCart({ item_id: cart.item_id, user_id: userId}, (cartCheckError, cartCheckResult) => {
          if (cartCheckError) {
            return cb(cartCheckError);
          }
          if (!_.isEmpty(cartCheckResult)) {
            let resourceNotFoundOErrorObj = new ResourceNotFoundError(
              "The cart with item " + cart.item_id + " already exists in user cart"
            );
            return cb(resourceNotFoundOErrorObj);
          }
          return cb();
        });
      },
    ], (parallelError) => {
      if (parallelError) {
        return next(parallelError);
      }
      let cartDetails = new Cart({
        item_id: cart.item_id,
        user_id: userId,
        quantity: cart.quantity
      });
      cartDetails.save((saveError, saveCart) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            'There was an error while creating a new cart',
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 201;
        res.end(JSON.stringify(saveCart));
      });
    });
  }

  /**
   * Get all items in cart
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getCartList(req, res, next) {
    let userId = JWT.decode(req.headers['x-request-jwt']).sub;//req.authentication.jwt.payload.user_id;
    let query = QueryHelper.getQuery(req.swagger.params);
    query.user_id = userId;
    Cart.find(query)
    .sort({'created_at': 1})
    .exec((cartFindError, cartRecords) => {
      res.setHeader('Content-Type', 'application/json');
      if (cartFindError) {
        let runtimeError = new RuntimeError(
          'There was an error while fetching all cart items',
          cartFindError
        );
        return next(runtimeError);
      }
      if (_.isEmpty(cartRecords)) {
        res.statusCode = 204;
        return res.end();
      }
      let cartAry = [];
      async.eachLimit(
        cartRecords,
        5,
        (cartObj, eachCartCb) => {
          cartObj = cartObj.toObject();
          CheckItem({ _id: cartObj.item_id }, (checkErr, checkResult) => {
            if (checkErr) {
              return eachCartCb(checkErr);
            }
            cartObj.item = checkResult.toObject();
            cartAry.push(cartObj);
            return eachCartCb();
          });
          // if (cartObj.category_data && cartObj.category_data.length) {
          //   cartObj.category_name = cartObj.category_data[0].name;
          // }
        },
        (eachError) => {
          if (eachError) {
            return next(eachError);
          }
          res.statusCode = 200;
          res.end(JSON.stringify(cartAry));
        }
      );
      // res.statusCode = 200;
      // res.end(JSON.stringify(cartRecords));
    });
  }

  /**
   * Get cart with given cart_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getCart(swaggerParams, res, next) {
    let cartId = swaggerParams.cart_id.value;
    CheckCart({ _id: cartId }, (cartCheckError, cartCheckResult) => {
      if (cartCheckError) {
        return next(cartCheckError);
      }
      if (_.isEmpty(cartCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The cart with id " + cartId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(cartCheckResult));
    });
  }

  /**
   * Update cart with given cart_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateCart(swaggerParams, res, next) {
    let cartId = swaggerParams.cart_id.value;
    let cart = swaggerParams.cart.value;
    CheckCart({ _id: cartId }, (cartCheckError, cartCheckResult) => {
      if (cartCheckError) {
        return next(cartCheckError);
      }
      if (_.isEmpty(cartCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The cart with id " + cartId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      cartCheckResult.quantity = cart.quantity ? cart.quantity : cartCheckResult.quantity;
      cartCheckResult.save((saveError, saveCart) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            'There was an error while updating a cart',
            saveError
          );
          return cb(runtimeError);
        }
        CheckItem({ _id: cartCheckResult.item_id, is_deleted: false }, (cartCheckError, cartCheckResult) => {
          if (cartCheckError) {
            return next(cartCheckError);
          }
          saveCart = saveCart.toObject();
          saveCart.item = cartCheckResult.toObject();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(saveCart));
        });
      });
    });   
  }

  /**
   * Delete cart with given cart_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   deleteCart(swaggerParams, res, next) {
    let cartId = swaggerParams.cart_id.value;
    CheckCart({ _id: cartId }, (cartCheckError, cartCheckResult) => {
      if (cartCheckError) {
        return next(cartCheckError);
      }
      if (_.isEmpty(cartCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The cart with id " + cartId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      cartCheckResult.remove((removeError, removeCart) => {
        if (removeError) {
          let runtimeError = new RuntimeError(
            'There was an error while removing a cart',
            removeError
          );
          return cb(runtimeError);
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(removeCart));
      });
    });   
  }
}

/**
 * Checks for cart existence
 *
 * @param {Object} query - The cart findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckCart(query, callback) {
  Cart.findOne(query)
    .exec((cartFindOneError, cartRecord) => {
      if (cartFindOneError) {
        let runtimeErrorObj = new RuntimeError(
          'There was an error while finding cart',
          cartFindOneError
        );
        return callback(runtimeErrorObj);
      }
      return callback(null, cartRecord);
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
  Item.findOne(query)
  .select({_id:1, name:1, online_price:1})
  .exec((findOneError, findRecord) => {
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

module.exports = CartService;