"use strict";

const _ = require("lodash");
const path = require("path");
const async = require("async");
const { PaymentGateway } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require("jsonwebtoken");

const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of payment gateway service
 */
class PaymentGatewayService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new payment gateway
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createPaymentGateway(req, res, next) {
    let userId = JWT.decode(req.headers["x-request-jwt"]).sub; //req.authentication.jwt.payload.user_id;
    let paymentGateway = req.swagger.params.paymentGateway.value;
    let paymentGatewayDetails = new PaymentGateway({
      client_id: paymentGateway.client_id,
      secret_key: paymentGateway.secret_key,
      type: paymentGateway.type,
      is_test: paymentGateway.is_test,
      created_by: userId,
      is_deleted: paymentGateway.is_deleted
    });
    paymentGatewayDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new payment gateway",
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
   * Get all payment gateway
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getPaymentGatewayList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    PaymentGateway.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all payment gateways",
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
   * Get payment gateway with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getPaymentGateway(swaggerParams, res, next) {
    let paymentGatewayId = swaggerParams.payment_gateway_id.value;
    CheckPaymentGateway(
      { _id: paymentGatewayId },
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
   * Update payment gateway with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updatePaymentGateway(swaggerParams, res, next) {
    let paymentGatewayId = swaggerParams.payment_gateway_id.value;
    let paymentGateway = swaggerParams.paymentGateway.value;
    CheckPaymentGateway({ _id: paymentGatewayId }, (checkError, paymentGatewayRecord) => {
      if (checkError) {
        return next(checkError);
      }
      paymentGatewayRecord.client_id = paymentGateway.client_id ? paymentGateway.client_id : paymentGatewayRecord.client_id;
      paymentGatewayRecord.secret_key = paymentGateway.secret_key ? paymentGateway.secret_key : paymentGatewayRecord.secret_key;
      paymentGatewayRecord.type = paymentGateway.type ? paymentGateway.type : paymentGatewayRecord.type;
      paymentGatewayRecord.is_test = paymentGateway.is_test != undefined ? paymentGateway.is_test : paymentGatewayRecord.is_test;
      paymentGatewayRecord.is_deleted = paymentGateway.is_deleted != undefined ? paymentGateway.is_deleted : paymentGatewayRecord.is_deleted;
      paymentGatewayRecord.save((saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a payment gateway",
            saveError
          );
          return next(runtimeError);
        }
        if (paymentGateway.is_deleted != undefined && !paymentGateway.is_deleted) {
          PaymentGateway.updateMany(
            {
              _id: { $ne: paymentGatewayId }
            },
            {'$set': {is_deleted: true}}, 
            {'multi': true},
            (updateError) => {
              if (updateError) {
                let runtimeError = new RuntimeError(
                  'There was an error while updating payment gateways',
                  updateError
                );
                return next(runtimeError);
              }
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify(saveRecord));
            }
          );
        } else {
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(JSON.stringify(saveRecord));
        }
      });
    });
  }
}

/**
 * Checks for payment gateway existence
 *
 * @param {Object} query - The payment gateway findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckPaymentGateway(query, callback) {
  PaymentGateway.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding payment gateway",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The payment gateway with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    return callback(null, findRecord);
  });
}

module.exports = PaymentGatewayService;
