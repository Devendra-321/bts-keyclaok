"use strict";

const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const async = require("async");
const config = require("config");
const moment = require("moment");
const randomstring = require("randomstring");
const {
  Order,
  User,
  Item,
  Cart,
  UserDiscountCode,
  CheckoutFacility,
  PaymentGateway,
} = require("../models");
const { sendMail } = require("../helpers/EmailHelper");
// const { printReceipt } = require("../helpers/PrintHelper");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");
const appDir = path.dirname(require.main.filename);

/**
 * Creates an instance of order service
 */
class OrderService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new order
   * @param {object} swaggerParams - The swagger parameter
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createOrder(req, res, next) {
    // let userId = req.authentication.jwt.payload.user_id;
    // let email = req.authentication.jwt.payload.email;
    // let name = req.authentication.jwt.payload.name;
    let jwtToken = req.headers['x-request-jwt'];
    console.log(jwtToken);
    let userId = "f72ed6ee-b942-4364-b0fc-80bd25251873";
    let email = "test1@test.co";
    let name ="Test";
    let order = req.swagger.params.order.value;
    let itemIds = _.map(order.item_details, "id");
    let itemTotal = order.item_details.reduce(
      (accumulator, current) => accumulator + current.quantity * current.price,
      0
    );
    let orderTotal =
      itemTotal +
      (order.tips ? order.tips : 0) +
      (order.bags ? order.bags : 0) +
      (order.service_charge ? order.service_charge : 0) +
      (order.delivery_charge ? order.delivery_charge : 0);
    orderTotal =
      orderTotal -
      (order.discount && order.discount.amount ? order.discount.amount : 0);
    orderTotal = orderTotal * 100;
    let paymentGateway;
    async.autoInject(
      {
        getOrderNumber: (cb) => {
          checkMaxOrder({}, (checkErr, result) => {
            if (checkErr) {
              return cb(checkErr);
            }
            return cb(null, result + 1);
          });
        },
        makePayment: (getOrderNumber, cb) => {
          if (order.payment_type && order.payment_type === "Card") {
            CheckPaymentGateway(
              { is_deleted: false },
              (checkError, checkResult) => {
                if (checkError) {
                  return cb(checkError);
                }
                if (!_.includes(["STRIPE", "SQUARE"], checkResult.type)) {
                  let validationErrorObj = new ValidationError(
                    "The payment gateway stripe or square must be enable for further process"
                  );
                  return cb(validationErrorObj);
                }
                if (checkResult.type === "STRIPE") {
                  paymentGateway = "STRIPE";
                  stripePayment(
                    checkResult.secret_key,
                    email,
                    order.token_id,
                    orderTotal,
                    getOrderNumber,
                    cb
                  );
                } else {
                  paymentGateway = "SQUARE";
                  squarePayment(
                    checkResult.secret_key,
                    order.token_id,
                    orderTotal,
                    cb
                  );
                }
              }
            );
          } else {
            return cb();
          }
        },
        saveOrder: (getOrderNumber, makePayment, cb) => {
          let orderDetails = new Order({
            user_id: userId,
            item_details: order.item_details,
            order_type: order.order_type,
            time: order.time,
            address: order.address,
            discount: order.discount,
            tips: order.tips,
            bags: order.bags,
            notes: order.notes,
            service_charge: order.service_charge,
            delivery_charge: order.delivery_charge,
            order_total: order.order_total,
            order_number: getOrderNumber,
            status: "InProgress",
            payment_status: order.payment_status,
            payment_type: order.payment_type,
            payment_gateway: paymentGateway,
            panel_type: order.panel_type,
          });
          if (makePayment) {
            if (paymentGateway === "STRIPE") {
              orderDetails.card_id = makePayment ? makePayment.card_id : "";
              orderDetails.customer_id = makePayment
                ? makePayment.customer_id
                : "";
              orderDetails.transaction_id = makePayment
                ? makePayment.transaction_id
                : "";
            } else {
              orderDetails.card_id = makePayment ? makePayment.card_id : "";
              orderDetails.customer_id = makePayment
                ? makePayment.customer_id
                : "";
              orderDetails.transaction_id = makePayment
                ? makePayment.payment.id
                : "";
            }
          }
          orderDetails.save((saveError, saveOrder) => {
            if (saveError) {
              let runtimeError = new RuntimeError(
                "There was an error while creating a new order",
                saveError
              );
              return cb(runtimeError);
            }
            return cb(null, saveOrder);
          });
        },
        saveCode: (saveOrder, cb) => {
          if (order.discount && order.discount.code) {
            let orderDetails = new UserDiscountCode({
              user_id: userId,
              order_id: saveOrder._id,
              code: order.discount && order.discount.code,
            });
            orderDetails.save((saveError, saveCode) => {
              if (saveError) {
                let runtimeError = new RuntimeError(
                  "There was an error while adding a new discount code",
                  saveError
                );
                return cb(runtimeError);
              }
              return cb(null, saveCode);
            });
          } else {
            return cb();
          }
        },
        RemoveCart: (cb) => {
          async.eachLimit(
            itemIds,
            3,
            (itemId, eachCartCb) => {
              Cart.findOne(
                { user_id: userId, item_id: itemId },
                (cartError, cartRecord) => {
                  if (cartError) {
                    let runtimeError = new RuntimeError(
                      "There was an error while finding item from user's cart",
                      cartError
                    );
                    return eachCartCb(runtimeError);
                  }
                  if (_.isEmpty(cartRecord)) {
                    return eachCartCb();
                  }
                  cartRecord.remove((deleteCartError) => {
                    if (deleteCartError) {
                      let runtimeErrorObj = new RuntimeError(
                        "There was an error while deleting item from user's cart",
                        deleteCartError
                      );
                      return eachCartCb(runtimeErrorObj);
                    }
                    return eachCartCb();
                  });
                }
              );
            },
            (eachError) => {
              if (eachError) {
                return cb(eachError);
              }
              return cb();
            }
          );
        },
        sendMail: (saveOrder, cb) => {
          Item.find({ _id: { $in: itemIds } }, (findError, findRecords) => {
            if (findError) {
              let runtimeErrorObj = new RuntimeError(
                "There was an error while finding and order items",
                findError
              );
              return cb(runtimeErrorObj);
            }
            _sendOrderPlacedMail(
              name,
              email,
              saveOrder,
              itemTotal,
              orderTotal,
              findRecords,
              (mailError) => {
                if (mailError) {
                  let runtimeError = new RuntimeError(
                    "There was an error while sending order placed mail to the customer",
                    mailError
                  );
                  return cb(runtimeError);
                }
                return cb();
              }
            );
          });
        },
      },
      (autoInjectError, result) => {
        if (autoInjectError) {
          return next(autoInjectError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 201;
        res.end(JSON.stringify(result.saveOrder));
      }
    );
  }

  /**
   * Get all orders
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getOrderList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    if (query.date) {
      let date = query.date["$in"];
      let startDate = moment(date).startOf("day").format("YYYY-MM-DD HH:mm:ss");
      let endDate = moment(date).endOf("day").format("YYYY-MM-DD HH:mm:ss");
      query.created_at = { $gte: startDate, $lt: endDate };
      delete query.date;
    }
    Order.find(query)
      .sort({ created_at: 1 })
      .exec((findError, findRecords) => {
        res.setHeader("Content-Type", "application/json");
        if (findError) {
          let runtimeError = new RuntimeError(
            "There was an error while fetching all orders",
            findError
          );
          return next(runtimeError);
        }
        if (_.isEmpty(findRecords)) {
          res.statusCode = 204;
          return res.end();
        }
        let orderAry = [];
        async.eachLimit(
          findRecords,
          10,
          (order, eachCb) => {
            let orderData = order.toObject();
            CheckUser(order.user_id, (userCheckError, userData) => {
              if (userCheckError) {
                return eachCb(userCheckError);
              }
              orderData.user = userData.toObject();
              orderAry.push(orderData);
              return eachCb();
            });
          },
          (eachError) => {
            if (eachError) {
              return next(eachError);
            }
            res.statusCode = 200;
            res.end(JSON.stringify(orderAry));
          }
        );
      });
  }

  /**
   * Get order with given order_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getOrder(swaggerParams, res, next) {
    let orderId = swaggerParams.order_id.value;
    CheckOrder({ _id: orderId }, (checkError, checkResult) => {
      if (checkError) {
        return next(checkError);
      }
      if (_.isEmpty(checkResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The order with id " + orderId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(checkResult));
    });
  }

  /**
   * Update order with given order_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateOrder(swaggerParams, res, next) {
    let orderId = swaggerParams.order_id.value;
    let order = swaggerParams.order.value;
    CheckOrder({ _id: orderId }, (checkError, checkResult) => {
      if (checkError) {
        return next(checkError);
      }
      if (_.isEmpty(checkResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The order with id " + orderId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      if (
        order.status &&
        order.status === "Delivered" &&
        checkResult.payment_type === "Cash"
      ) {
        checkResult.payment_status = "Done";
      }
      checkResult.status = order.status ? order.status : checkResult.status;
      checkResult.payment_status = order.payment_status
        ? order.payment_status
        : checkResult.payment_status;
      checkResult.panel_type = order.panel_type
        ? order.panel_type
        : checkResult.panel_type;
      checkResult.payment_type = order.payment_type
        ? order.payment_type
        : checkResult.payment_type;
      checkResult.save((saveError, saveOrder) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating an order",
            saveError
          );
          return next(runtimeError);
        }
        // if (order.status && order.status === 'Approved') {
        //   printReceipt('file', (printError, printResult) => {
        //     if (printError) {
        //       let runtimeError = new RuntimeError(
        //         "There was an error while printing a receipt",
        //         printError
        //       );
        //       return next(runtimeError);
        //     }
        //     //remaining process
        //   });
        // }
        CheckUser(checkResult.user_id, (userCheckError, userData) => {
          if (userCheckError) {
            return next(userCheckError);
          }
          let file, subject;
          if (order.status == "Approved") {
            file = "OrderAccepted.html";
            subject = "Congrats! Your order has been accepted!";
          } else if (order.status == "Cancelled") {
            file = "OrderCancelled.html";
            subject = "Congrats! Your order has been cancelled!";
          } else if (order.status == "Delivered") {
            file = "OrderDelivered.html";
            subject = "Congrats! Your order has been delivered!";
          }
          _sendOrderMail(
            file,
            subject,
            userData.name,
            userData.email,
            (mailError) => {
              if (mailError) {
                let runtimeError = new RuntimeError(
                  "There was an error while sending order mail to the buyer",
                  mailError
                );
                return next(runtimeError);
              }
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify(saveOrder));
            }
          );
        });
      });
    });
  }

  /**
   * Check discount code validity
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  checkCodeValidity(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    UserDiscountCode.findOne(query).exec((findOneError, findRecord) => {
      if (findOneError) {
        let runtimeErrorObj = new RuntimeError(
          "There was an error while finding user discount code",
          findOneError
        );
        return next(runtimeErrorObj);
      }
      if (!_.isEmpty(findRecord)) {
        let validationErrorObj = new ValidationError(
          "The discount code " + query.code + " already used by this user"
        );
        return next(validationErrorObj);
      }
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify({}));
    });
  }

  /**
   * Get order statistics
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  orderStatistics = async (swaggerParams, res, next) => {
    let startDate = new Date(swaggerParams.start_date.value);
    startDate.setDate(startDate.getDate() + 1);
    let endDate = new Date(swaggerParams.end_date.value);
    let orderType = swaggerParams.order_type.value;
    let status = swaggerParams.status.value;
    let item = swaggerParams.item_id.value;
    let category = swaggerParams.category_id.value;
    let startOfDay = moment(startDate).startOf("day");
    let queryArray = [];
    let queryMatch, query = {}, itemIds = [];
    if (startDate - endDate !== 0 && moment(endDate).isValid()) {
      queryMatch = {
        $match: {
          created_at: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      };
      query.created_at = {
        $gte: startDate,
        $lte: endDate,
      };
    } else {
      queryMatch = {
        $match: {
          created_at: {
            $gte: startOfDay.toDate(),
            $lte: moment(startOfDay).endOf("day").toDate(),
          },
        },
      };
      query.created_at = {
        $gte: startOfDay.toDate(),
        $lte: moment(startOfDay).endOf("day").toDate(),
      };
    }
    queryArray.push(queryMatch);
    if (category) {
      let itemRecords = await Item.find({category_id: category}).select({ _id: 1 });
      itemIds = _.map(itemRecords, '_id');
      query.item_details = {
        $elemMatch: { id: { $in: itemIds } }
      }
      queryMatch.$match.item_details = {
        $elemMatch: { id: { $in: itemIds } }
      };
    }
    if (orderType) {
      query.order_type = orderType;
      queryMatch.$match.order_type = orderType;
    }
    if (status) {
      query.status = status;
      queryMatch.$match.status = status;
    }
    if (item) {
      query.item_details = {
        $elemMatch: { id: item }
      }
      queryMatch.$match.item_details = {
        $elemMatch: { id: item }
      };
    }
    async.parallel([
      (cb) => {
        Order.find(query)
        .sort({ created_at: 1 })
        .exec((findError, findRecords) => {
          res.setHeader("Content-Type", "application/json");
          if (findError) {
            let runtimeError = new RuntimeError(
              "There was an error while fetching all orders",
              findError
            );
            return cb(runtimeError);
          }
          if (_.isEmpty(findRecords)) {
            res.statusCode = 204;
            return cb();
          }
          return cb(null, findRecords)
        });
      },
      (cb) => {
        let queryGrp = {
          $group: {
            _id: null,
            tips: {
              $sum: "$tips",
            },
            bags: {
              $sum: "$bags",
            },
            service_charge: {
              $sum: "$service_charge",
            },
            delivery_charge: {
              $sum: "$delivery_charge",
            },
            order_total: {
              $sum: "$order_total",
            },
          },
        };
        queryArray.push(queryGrp);
        Order.aggregate(queryArray).exec((countError, countResult) => {
          if (countError) {
            let runTimeError = new RuntimeError(
              "There was an error while counting order reporting",
              countError
            );
            return cb(runTimeError);
          }
          return cb(null, countResult);
        });
      },
    ], (parallelError, parallelResult) => {
      if (parallelError) {
        return next(parallelError)
      }
      let data = parallelResult[0] || [];
      let count = parallelResult[1][0];
      let discount = 0, grandTotal = 0, card = 0, cash = 0;
      if (data.length > 0) {
        for (let order of data) {
          let amount = order.discount && order.discount.amount ? order.discount.amount : 0; 
          let subTotal = order.order_total ? order.order_total : 0 - amount;
          discount += amount;
          grandTotal = grandTotal + subTotal;
          if (order.payment_type === 'Card') {
            card += subTotal
          } else {
            cash += subTotal
          }
        }
        count.discount = discount;
        count.grand_total = grandTotal;
        count.card = card;
        count.cash = cash;
      }
      let response = {
        data,
        count
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(response));
    });
  }

  /**
   * Get user statistics
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  userStatistics = async (swaggerParams, res, next) => {
    let startDate = new Date(swaggerParams.start_date.value);
    let endDate = new Date(swaggerParams.end_date.value);
    let startOfDay = moment(startDate).startOf("day");
    let queryArray = [];
    let queryMatch, query = {};
    if (startDate - endDate !== 0 && moment(endDate).isValid()) {
      queryMatch = {
        $match: {
          created_at: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      };
      query.created_at = {
        $gte: startDate,
        $lte: endDate,
      };
    } else {
      queryMatch = {
        $match: {
          created_at: {
            $gte: startOfDay.toDate(),
            $lte: moment(startOfDay).endOf("day").toDate(),
          },
        },
      };
      query.created_at = {
        $gte: startOfDay.toDate(),
        $lte: moment(startOfDay).endOf("day").toDate(),
      };
    }

    queryArray.push(queryMatch);
    Order.find(query)
    .select({ _id: 1, user_id: 1 })
    .sort({ created_at: 1 })
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all orders",
          findError
        );
        return next(runtimeError);
      }
      if (_.isEmpty(findRecords)) {
        res.statusCode = 204;
        return res.end();
      }
      const userIds = _.map(findRecords, 'user_id');
      User.find({_id: {$nin: userIds}})
        .select('-password')
        .exec((userFindError, userRecords) => {
          if (userFindError) {
            let runtimeError = new RuntimeError(
              'There was an error while fetching all inactive users',
              userFindError
            );
            return next(runtimeError);
          }
          if (_.isEmpty(userRecords)) {
            res.statusCode = 204;
            return res.end();
          }
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(userRecords));
        });
    });
  }
}

/**
 * Checks for order existence
 *
 * @param {Object} query - The order findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckOrder(query, callback) {
  Order.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding order",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    return callback(null, findRecord);
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
 * Checks for checkout facility existence
 *
 * @param {Object} query - The checkout facility findOne query
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
          "There was an error while finding checkout facility",
          findOneError
        );
        return callback(runtimeErrorObj);
      }
      if (_.isEmpty(findRecord)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The value with id " + query._id + " does not exists"
        );
        return callback(resourceNotFoundOErrorObj);
      }
      return callback(null, findRecord);
    });
}

/**
 * Checks for max order
 *
 * @param {Object} query - The item find query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function checkMaxOrder(query, callback) {
  Order.find(query)
    .select("order_number")
    .sort({ order_number: -1 })
    .limit(1)
    .exec((findError, findRecord) => {
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while finding order",
          findError
        );
        return callback(runtimeError);
      }
      if (findRecord.length) {
        let max = findRecord[0].order_number || 0;
        return callback(null, parseInt(max));
      } else {
        CheckCheckoutFacility({ type: "ORDER_NUMBER" }, (checkErr, result) => {
          if (checkErr) {
            return callback(checkErr);
          }
          return callback(null, result.value);
        });
      }
    });
}

/**
 * Checks for user existence
 *
 * @param {String} userId - The user_id
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckUser(userId, callback) {
  User.findOne({ _id: userId })
    .select({ _id: 1, name: 1, email: 1 })
    .exec((userFindError, userRecord) => {
      if (userFindError) {
        let runTimeError = new RuntimeError(
          "There was an error while fetching user with id " + userId,
          userFindError
        );
        return callback(runTimeError);
      }
      if (_.isEmpty(userRecord)) {
        let validationError = new ValidationError(
          "The user with id " + userId + " does not exist"
        );
        return callback(validationError);
      }
      return callback(null, userRecord);
    });
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

/**
 * Square payment
 *
 * @param {String} secretKey - The secret key
 * @param {String} token - The card token
 * @param {Number} amount - The amount
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
async function squarePayment(secretKey, token, amount, callback) {
  const { Client, Environment } = require("square");
  const client = new Client({
    environment: Environment.Sandbox,
    accessToken: secretKey,
  });
  try {
    const response = await client.paymentsApi.createPayment({
      sourceId: "cnon:card-nonce-ok",
      idempotencyKey: randomstring.generate(),
      amountMoney: {
        amount: amount,
        currency: "USD",
      },
    });
    return callback(null, response.result);
  } catch (error) {
    return callback(error);
  }
}

/**
 * Stripe payment
 *
 * @param {String} secretKey - The secret key
 * @param {String} email - The email
 * @param {String} token - The card token
 * @param {Number} amount - The amount
 * @param {String} orderNumber - The order number
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function stripePayment(secretKey, email, token, amount, orderNumber, callback) {
  const stripe = require("stripe")(secretKey);
  stripe.customers.create(
    {
      // name: "Kiran virani",
      email: email,
      // address: {
      //   city: "surat",
      //   country: "India",
      //   line1: "TEst",
      //   line2: "Test",
      //   postal_code: 12345,
      //   state: "gujarat",
      // },
    },
    (customerCreateError, customerDetails) => {
      if (customerCreateError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating stripe customer",
          customerCreateError
        );
        return callback(runtimeError);
      }
      stripe.customers.createSource(
        customerDetails.id,
        {
          source: token,
        },
        (err, data) => {
          if (err) {
            let runtimeError = new RuntimeError(
              "Whoops!\n Something isn't right with that credit/debit card. Please try again!",
              err
            );
            return callback(runtimeError);
          }
          stripe.paymentIntents.create(
            {
              amount: amount,
              currency: "inr",
              payment_method_types: ["card"],
              customer: customerDetails.id,
              payment_method: data.id,
              confirm: true,
              transfer_group: orderNumber,
              description: `Charge for ${orderNumber}`,
            },
            (err, charge) => {
              if (err) {
                let runtimeError = new RuntimeError(
                  "There was an error while making an payment for order",
                  err
                );
                return callback(runtimeError);
              }
              let card = {
                customer_id: customerDetails.id,
                card_id: data.id,
                transaction_id: charge.id,
              };
              return callback(null, card);
            }
          );
        }
      );
    }
  );
}

/**
 * Send order placed mail notification to the customer
 *
 * @param {String} name - The customer name
 * @param {String} email - The customer email
 * @param {Object} orderData - The order detail object
 * @param {Number} itemTotal - The item total
 * @param {Number} orderTotal - The order total
 * @param {Array} itemAry - The order item array
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function _sendOrderPlacedMail(
  name,
  email,
  orderData,
  itemTotal,
  orderTotal,
  itemAry,
  callback
) {
  let itemContent;
  let items = "";
  async.eachLimit(
    itemAry,
    3,
    (itemObj, eachItemCb) => {
      fs.readFile(
        appDir + "/mail-templates/ItemOrder.html",
        function read(err, data) {
          if (err) {
            let runtimeError = new RuntimeError(
              "There was an error while reading item data",
              err
            );
            return eachItemCb(runtimeError);
          }
          itemContent = data.toString();
          let mapObj = {
            "#itemTitle": itemObj.name,
            "#listPrice": itemObj.online_price,
            "#itemImage": itemObj.item_images[0],
          };
          // priceTotal = priceTotal + itemObj.listing_price;
          itemContent = itemContent.replace(
            /#itemImage|#itemTitle|#listPrice/gi,
            (matched) => {
              return mapObj[matched];
            }
          );
          items = items.concat(itemContent);
          return eachItemCb();
        }
      );
    },
    (eachError) => {
      if (eachError) {
        return callback(eachError);
      }
      let content;
      fs.readFile(
        appDir + "/mail-templates/OrderPlaced.html",
        function read(err, data) {
          if (err) {
            let runtimeError = new RuntimeError(
              "There was an error while sending mail to the seller",
              err
            );
            return callback(runtimeError);
          }
          content = data.toString();
          let mapObj = {
            "#username": name,
            "#orderNo": orderData.order_number,
            "#items": items,
            "#subtotal": itemTotal,
            "#discount": orderData.discount ? orderData.discount.amount : 0,
            "#bags": orderData.bags ? orderData.bags : 0,
            "#tips": orderData.tips ? orderData.tips : 0,
            "#serviceCharge": orderData.service_charge
              ? orderData.service_charge
              : 0,
            "#deliveryCharge": orderData.delivery_charge
              ? orderData.delivery_charge
              : 0,
            "#total": orderTotal / 100,
            "#mobile": orderData.address ? orderData.address.mobile : 0,
            "#address": orderData.address ? orderData.address.post_code : 0,
            "#postcode": orderData.address ? orderData.address.address : 0,
          };
          content = content.replace(
            /#username|#orderNo|#items|#subtotal|#discount|#bags|#tips|#serviceCharge|#deliveryCharge|#total|#mobile|#address|#postcode/gi,
            (matched) => {
              return mapObj[matched];
            }
          );
          let options = {
            to: email,
            subject: "You placed an order!",
            html: content,
          };
          sendMail(options, callback);
        }
      );
    }
  );
}

/**
 * Send mail notification for updating order status
 *
 * @param {String} file - The mail template file
 * @param {String} subject - The email subject
 * @param {String} name - The customer name
 * @param {String} email - The customer email
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function _sendOrderMail(file, subject, name, email, callback) {
  let content;
  fs.readFile(`${appDir}/mail-templates/${file}`, function read(err, data) {
    if (err) {
      let runtimeError = new RuntimeError(
        "There was an error while sending mail to the customer",
        err
      );
      return callback(runtimeError);
    }
    content = data.toString();
    let mapObj = {
      "#username": name,
    };
    content = content.replace(/#username/gi, (matched) => {
      return mapObj[matched];
    });
    let options = {
      to: email,
      subject: subject,
      html: content,
    };
    sendMail(options, callback);
  });
}

module.exports = OrderService;
