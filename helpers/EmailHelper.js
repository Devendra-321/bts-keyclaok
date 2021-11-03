"use strict";

const _ = require("lodash");
const AWS = require("aws-sdk");
const config = require("config");
const nodemailer = require("nodemailer");
const { Config } = require("../models");
const { RuntimeError, ValidationError } = require("../helpers/bts-error-utils");

const getConfigs = (callback) => {
  Config.findOne({ is_deleted: false, type: "SMTP" }).exec(
    (findOneError, findRecord) => {
      if (findOneError) {
        let runtimeErrorObj = new RuntimeError(
          "There was an error while finding config",
          findOneError
        );
        return callback(runtimeErrorObj);
      }
      return callback(null, findRecord);
    }
  );
};

const transport = nodemailer.createTransport({
  host: config.get("mail.host"),
  port: config.get("mail.port"),
  secure: true,
  auth: {
    user: config.get("mail.user"),
    pass: config.get("mail.pass"),
  },
  // service: "gmail",
  // auth: {
  //   user: config.get("mail.user"),
  //   pass: config.get("mail.pass"),
  // },
});

module.exports = {
  sendMail: (options, callback) => {
    let data = _.extend(options, {
      from: "kiran.tophat@gmail.com",
    });
    getConfigs((checkError, checkResult) => {
      if (checkError) {
        return callback(checkError);
      }
      const transport = nodemailer.createTransport({
        host: checkResult && checkResult.configs ? checkResult.configs.host : config.get("mail.host"),
        port: checkResult && checkResult.configs ? checkResult.configs.port : config.get("mail.port"),
        secure: false,
        auth: {
          user: checkResult && checkResult.configs ? checkResult.configs.user : config.get("mail.user"),
          pass: checkResult && checkResult.configs ? checkResult.configs.pass : config.get("mail.pass"),
        },
        tls: {
          ciphers:'SSLv3'
        }
      });
      transport.sendMail(data, (err, info) => {
        if (err) {
          console.log('error====================================', err)
          let runtimeError = new RuntimeError(
            "There was an error while sending mail",
            err
          );
          return callback(runtimeError);
        }
        return callback();
      });
    });
  },
  receiveMail: (options, callback) => {
    let data = _.extend(options, {
      to: "kiran.tophat@gmail.com",
    });
    getConfigs((checkError, checkResult) => {
      if (checkError) {
        return callback(checkError);
      }
      const transport = nodemailer.createTransport({
        host: checkResult.configs.host || config.get("mail.host"),
        port: checkResult.configs.port || config.get("mail.port"),
        secure: true,
        auth: {
          user: checkResult.configs.user || config.get("mail.user"),
          pass: checkResult.configs.pass || config.get("mail.pass"),
        }
      });
      transport.sendMail(data, (err, info) => {
        if (err) {
          let runtimeError = new RuntimeError(
            "There was an error while receiving mail",
            err
          );
          return callback(runtimeError);
        }
        return callback();
      });
    });
  },
  sendAwsSesMail: (options, callback) => {
    const awsConfigs = {
      accessKeyId: config.get("aws.access_key"),
      secretAccessKey: config.get("aws.secret_key"),
      region: config.get("aws.region"),
    };
    AWS.config.update(awsConfigs);
    const params = {
      Destinations: [
        {
          ToAddresses: ["EMAIL_ADDRESS", "EMAIL_ADDRESS"],
        },
      ],
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: "HTML_FORMAT_BODY",
          },
          Text: {
            Charset: "UTF-8",
            Data: "TEXT_FORMAT_BODY",
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Test email",
        },
      },
      Source: "SENDER_EMAIL_ADDRESS",
      ReplyToAddresses: ["EMAIL_ADDRESS"],
    };
    const sendPromise = new AWS.SES({ apiVersion: "2010-12-01" })
      .sendEmail(params)
      .promise();
    sendPromise
      .then((data) => {
        return callback(data);
      })
      .catch((err) => {
        let runtimeError = new RuntimeError(
          "There was an error while sending mail",
          err
        );
        return callback(runtimeError);
      });
  },
};
