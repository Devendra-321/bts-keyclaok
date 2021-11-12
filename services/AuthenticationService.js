"use strict";

const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const async = require("async");
const config = require('config');
const passwordHash = require("password-hash");
const randomstring = require('randomstring');
const { User } = require("../models");
const { sendMail } = require("../helpers/EmailHelper");
const JWTSecurityHelper = require("../helpers/JWTSecurityHelper");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  ValidationError,
  RuntimeError,
  ConflictError,
  ResourceNotFoundError
} = require("../helpers/bts-error-utils");
const moment = require("moment");
const appDir = path.dirname(require.main.filename);

/**
 * Creates an instance of user authentication service
 */
class AuthenticationService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new user
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  userSignUp(swaggerParams, res, next) {
    let user = swaggerParams.user.value;
    let userEmail = user.email;
    let userName = user.name;
    let userDetails = new User({
      name: userName,
      email: userEmail,
      role: user.role,
      password: passwordHash.generate(user.password),
      address_details: user.address_details,
      is_email_verified: true,
      contact_number: user.contact_number,
    });
    CheckUser({ email: userEmail }, (userCheckError, userCheckResult) => {
      if (userCheckError) {
        return next(userCheckError);
      }
      if (!_.isEmpty(userCheckResult)) {
        if (userCheckResult.is_email_verified) {
          let validationErrorObj = new ValidationError(
            "Whoops!\n A user with that email address already exists!"
          );
          return next(validationErrorObj);
        }
        if (!userCheckResult.is_email_verified) {
          let conflictError = new ConflictError(
            "The account is not verified, please verify your account"
          );
          return next(conflictError);
        }
      }
      userDetails.save((saveError, saveUser) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while creating a new user",
            saveError
          );
          return next(runtimeError);
        }
        let link = `http://localhost:3200/v1/update-email-status?email_id=${userEmail}`
        _sendVerificationMail(saveUser.email, link, 'EmailVerification.html', 'Please verify your email', (mailError) => {
          if (mailError) {
            let runtimeError = new RuntimeError(
              "There was an error while sending email verification mail to the registered user",
              mailError
            );
            return next(runtimeError);
          }
          let tokenPayload = {
            user_id: userDetails._id,
            email: userDetails.email,
            name: userDetails.name,
            role: userDetails.role,
          };
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 201;
          res.end(JSON.stringify(tokenPayload));
        });
      });
    });
  }

  /**
   * Creates a new user
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  userSignIn(swaggerParams, res, next) {
    let user = swaggerParams.user.value;
    let userEmail = user.email;
    let userPass = user.password;
    CheckUser(
      { email: userEmail, is_email_verified: true },
      (userCheckError, userCheckResult) => {
        if (userCheckError) {
          return next(userCheckError);
        }
        if (_.isEmpty(userCheckResult)) {
          let validationErrorObj = new ValidationError(
            "User with email " + userEmail + " does not exists!"
          );
          return next(validationErrorObj);
        } else if (!passwordHash.verify(userPass, userCheckResult.password)) {
          let validationErrorObj = new ValidationError("Incorrect password!");
          return next(validationErrorObj);
        }
        userCheckResult.last_login_at = new Date();
        userCheckResult.save((loginTimeUpdateError) => {
          if (loginTimeUpdateError) {
            let runtimeErrorObj = new RuntimeError(
              "There was an error while updating login time of user",
              loginTimeUpdateError
            );
            return next(runtimeErrorObj);
          }
          let tokenPayload = {
            user_id: userCheckResult._id,
            email: userCheckResult.email,
            name: userCheckResult.name,
            role: userCheckResult.role,
          };
          JWTSecurityHelper.signJWT(tokenPayload, (signError, signToken) => {
            if (signError) {
              return next(signError);
            }
            const userResult = _.extend(tokenPayload, signToken);
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(JSON.stringify(userResult));
          });
        });
      }
    );
  }


  /**
   * Creates a new user
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   guestUserSignIn(swaggerParams, res, next) {
     console.log('in side guest user ');
     
     var request = require('request');
     var options = {
       'method': 'POST',
       'url': 'https://identity.bettertechsolutions.net/auth/realms/demo-public/protocol/openid-connect/token',
       'headers': {
         'Content-Type': 'application/x-www-form-urlencoded'
       },
       form: {
         'client_id': 'TestClient',
         'username': 'guestuser@gmail.com',
         'password': 'guestuser',
         'grant_type': 'password'
       }
     };
     request(options, function (error, response) {
       if (error) throw new Error(error);
       console.log( response.statusCode);
       res.setHeader("Content-Type", "application/json");
       response.statusCode = 200;
       res.end(response.body);
     });
  }



  /**
   * Verify an email
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateEmailStatus(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let email = query.email_id;
    CheckUser({ email: email }, (userCheckError, userCheckResult) => {
      if (userCheckError) {
        return next(userCheckError);
      }
      if (_.isEmpty(userCheckResult)) {
        let validationErrorObj = new ValidationError(
          "The user with email " + email + " does not exists"
        );
        return next(validationErrorObj);
      }
      userCheckResult.is_email_verified = true;
      userCheckResult.save((updateUserError, updatedRecord) => {
        if (updateUserError) {
          let runtimeErrorObj = new RuntimeError(
            "There was an error while verifying user's email",
            updateUserError
          );
          return next(runtimeErrorObj);
        }
        _sendWelcomeMail(
          updatedRecord.name,
          updatedRecord.email,
          (mailError) => {
            if (mailError) {
              let runtimeError = new RuntimeError(
                "There was an error while sending welcome mail to the user",
                mailError
              );
              return next(runtimeError);
            }
            res.writeHead(301, {
              Location: "https://seedemo.co.uk/",
            });
            return res.end();
          }
        );
      });
    });
  }

  /**
   * Updates user details
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateUserDetails(swaggerParams, res, next) {
    let userDetails = swaggerParams.user.value;
    let userId = swaggerParams.user_id.value;
    CheckUser({ _id: userId }, (userCheckError, userCheckResult) => {
      if (userCheckError) {
        return next(userCheckError);
      }
      if (_.isEmpty(userCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "We couldn't find an account with those details."
        );
        return next(resourceNotFoundOErrorObj);
      }
      let contactNo = userDetails.contact_number;
      userCheckResult.name = userDetails.name ? userDetails.name : userCheckResult.name;
      userCheckResult.contact_number = contactNo ? contactNo : userCheckResult.contact_number;
      userCheckResult.address_details = userDetails.address_details ? userDetails.address_details : userCheckResult.address_details;
      userCheckResult.is_deleted = userDetails.is_deleted != undefined ? userDetails.is_deleted : userCheckResult.is_deleted;
      userCheckResult.save((saveError, saveRecord) => {
        if (saveError) {
          let runtimeErrorObj = new RuntimeError(
            "There was an error while updating user details of user " + userId,
            saveError
          );
          return next(runtimeErrorObj);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(saveRecord));
      });
    });
  }

  /**
   * Gets user details of given user_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getUser(swaggerParams, res, next) {
    let userId = swaggerParams.user_id.value;
    CheckUser({ _id: userId }, (userCheckError, userCheckResult) => {
      if (userCheckError) {
        return next(userCheckError);
      }
      if (_.isEmpty(userCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The user with id " + userId + " does not exist"
        );
        return next(resourceNotFoundOErrorObj);
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(userCheckResult));
    });
  }

  /**
   * Gets list of users
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getUserList(swaggerParams, res, next) {
    let limit = QueryHelper.getItemsPerPage(swaggerParams);
    let sortBy = QueryHelper.getSortParams(swaggerParams);
    if (_.isEmpty(sortBy)) {
      sortBy = {'updated_at': -1};
    }
    res.setHeader('Content-Type', 'application/json');
    async.parallel([
      (cb) => {
        _getUserCount({role: {$eq: 'USER'}}, (countError, countResult) => {
          if (countError) {
            return cb(countError);
          }
          return cb(null, countResult);
        });
      },
      (cb) => {
        User.find({role: {$eq: 'USER'}})
          .collation({locale: 'en'})
          .select('-password')
          .skip(QueryHelper.getSkipValue(swaggerParams, limit))
          .sort(sortBy)
          .limit(limit)
          .exec((userFindError, userRecords) => {
            if (userFindError) {
              let runtimeError = new RuntimeError(
                'There was an error while fetching all users',
                userFindError
              );
              return cb(runtimeError);
            }
            if (_.isEmpty(userRecords)) {
              res.statusCode = 204;
              return res.end();
            }
            return cb(null, userRecords);
          });
      }
    ], (parallelError, parallelResult) => {
      if (parallelError) {
        return next(parallelError);
      }
      let count = parallelResult[0];
      let userRecords = parallelResult[1];

      res.statusCode = 200;
      res.setHeader('access-control-expose-headers', 'x-result-count');
      res.setHeader('x-result-count', count);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(userRecords));
    });
  }

  /**
   * Link for Reset password
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   resetPasswordLink(swaggerParams, res, next) {
    let userEmail = swaggerParams.user.value.email;
      async.autoInject({
        findUser: (cb) => {
          CheckUser({email: userEmail}, (userCheckError, userCheckResult) => {
            if (userCheckError) {
              return cb(userCheckError);
            }
            if (_.isEmpty(userCheckResult)) {
              let validationErrorObj = new ValidationError(
                'The user with email ' + userEmail + ' does not exist in the system'
              );
              return cb(validationErrorObj);
            }
            if (!_.isEmpty(userCheckResult) && !userCheckResult.is_email_verified) {
              let validationErrorObj = new ValidationError(
                "The account " + userEmail + "is not verified, please verify your account"
              );
              return cb(validationErrorObj);
            }
            return cb(null, userCheckResult);
          });
        },
        sendMail: (cb) => {
          let token = randomstring.generate(64);
          let link = `http://localhost:3200/v1/verify-reset-link?reset_token=${token}`
          let file = 'ResetPassword.html';
          let subject = 'Password Reset';
          _sendVerificationMail(userEmail, link, file, subject, (mailError) => {
            if (mailError) {
              return cb(mailError);
            }
            return cb(null, token);
          });
        },
        saveToken: (findUser, sendMail, cb) => {
          findUser.reset_token = sendMail,
          findUser.reset_token_expiry = moment().add(config.get('token.reset_password'), 'minutes').toISOString();
          findUser.save((saveError) => {
            if (saveError) {
              let runtimeError = new RuntimeError(
                'There was an error while storing a reset password token',
                saveError
              );
              return cb(runtimeError);
            }
            return cb();
          });
        }
      }, (autoInjectError) => {
        if (autoInjectError) {
          return next(autoInjectError);
        }
        let response = {
          message: 'Link sent to registered email.!'
        };
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(response));
      });
  }

  /**
   * Verify OTP for reset password
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   verifyResetPasswordLink(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    CheckUser(query, (userCheckError, userRecord) => {
      if (userCheckError) {
        return next(userCheckError);
      }
      if (_.isEmpty(userRecord)) {
        let validationErrorObj = new ValidationError(
          'Invalid reset password link'
        );
        return next(validationErrorObj);
      }
      if (moment().isAfter(moment(userRecord.reset_token_expiry))) {
        let validationErrorObj = new ValidationError(
          'Reset token expired'
        );
        return next(validationErrorObj);
      }
      res.writeHead(301, {
        Location: "https://seedemo.co.uk/",
      });
      return res.end();
    });
  }
}

/**
 * Checks for user existence
 *
 * @param {Object} query - The user findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckUser(query, callback) {
  User.findOne(query).exec((userFindOneError, userRecord) => {
    if (userFindOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding user",
        userFindOneError
      );
      return callback(runtimeErrorObj);
    }
    return callback(null, userRecord);
  });
}

/**
 * Send email verification mail to the user
 *
 * @param {String} emailId - The email-id of user to send mail
 * @param {Number} link - The verification link
 * @param {String} file - The email template file
 * @param {String} subject - The email subject
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 *
 */
function _sendVerificationMail(emailId, link, file, subject, callback) {
  let content;
  fs.readFile(
    appDir + "/mail-templates/" + file,
    function read(err, data) {
      if (err) {
        let runtimeError = new RuntimeError(
          "There was an error while reading mail template file",
          err
        );
        return callback(runtimeError);
      }
      content = data.toString();
      let mapObj = {
        "#email": emailId,
        "#url": link,
      };
      content = content.replace(/#email|#url/gi, (matched) => {
        return mapObj[matched];
      });
      let options = {
        to: emailId,
        subject: subject,
        html: content,
      };
      sendMail(options, callback);
    }
  );
}

/**
 * Send welcome email notification
 *
 * @param {String} username - The name of user
 * @param {String} emailId - The email-id of user to send mail
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function _sendWelcomeMail(username, emailId, callback) {
  let content;
  fs.readFile(
    appDir + "/mail-templates/WelcomeEmail.html",
    function read(err, data) {
      if (err) {
        let runtimeError = new RuntimeError(
          "There was an error while sending mail to the user",
          err
        );
        return callback(runtimeError);
      }
      content = data.toString();
      content = content.replace("#username", username);
      let options = {
        to: emailId,
        subject: "Welcome to BTS!",
        html: content,
      };
      sendMail(options, callback);
    }
  );
}

/**
 * Send mail for reset password with link
 *
 * @param {String} username - The name of user
 * @param {String} emailId - The email-id of user to send mail
 * @param {Number} link - The 4-digit link
 * @param {String} file - The email template file
 * @param {String} subject - The email subject
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
 function _sendMail(username, emailId, link, file, subject, callback) {
  let content;
  fs.readFile(appDir + '/mail-templates/'+file, function read(err, data) {
    if (err) {
      let runtimeError = new RuntimeError(
        'There was an error while sending mail to the user',
        err
      );
      return callback(runtimeError);
    }
    content = data.toString();
    let mapObj = {
      '#name': username,
      '#link': link
    };
    content = content.replace(/#name|#link/gi, (matched) => {
      return mapObj[matched];
    });
    let options = {
      to: emailId,
      subject: subject,
      html: content
    };
    sendMail(options, callback);
  });
}

/**
 * Gets the count of user data that matches a given query
 *
 * @param {object} query - The query for the database call
 * @param {function} callback - The callback
 *
 *
 * @private
 *
 */
 function _getUserCount(query, callback) {
  User.count(query, function countResults(countError, countResult) {
    if (countError) {
      let runTimeError = new RuntimeError(
        'An error occurred while counting product records',
        countError
      );
      return callback(runTimeError);
    }
    return callback(null, countResult);
  });
}

module.exports = AuthenticationService;
