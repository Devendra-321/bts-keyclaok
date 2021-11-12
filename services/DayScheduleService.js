"use strict";

const _ = require("lodash");
const async = require("async");
const { DaySchedule } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require("jsonwebtoken");

const {
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of day schedule
 */
class DayScheduleService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new schedule
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createDaySchedule(req, res, next) {
    let userId = JWT.decode(req.headers["x-request-jwt"]).sub; // req.authentication.jwt.payload.user_id;
    let schedule = req.swagger.params.schedule.value;
    let dayScheduleDetails = new DaySchedule({
      day: schedule.day,
      morning_time: schedule.morning_time,
      evening_time: schedule.evening_time,
      created_by: userId,
      is_deleted: schedule.is_deleted,
      is_removed: schedule.is_removed,
    });
    dayScheduleDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new day schedule",
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
   * Get all schedules
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDayScheduleList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    query.is_removed = false;
    DaySchedule.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all day schedules",
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
   * Get schedule with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDaySchedule(swaggerParams, res, next) {
    let scheduleId = swaggerParams.schedule_id.value;
    CheckDaySchedule(
      { _id: scheduleId },
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
   * Update schedule with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateDaySchedule(swaggerParams, res, next) {
    let scheduleId = swaggerParams.schedule_id.value;
    let schedule = swaggerParams.schedule.value;
    CheckDaySchedule({ _id: scheduleId }, (checkError, scheduleRecord) => {
      if (checkError) {
        return next(checkError);
      }
      scheduleRecord.day = schedule.day ? schedule.day : scheduleRecord.day;
      scheduleRecord.morning_time = schedule.morning_time ? schedule.morning_time : scheduleRecord.morning_time;
      scheduleRecord.evening_time = schedule.evening_time ? schedule.evening_time : scheduleRecord.evening_time;
      scheduleRecord.is_deleted = schedule.is_deleted != undefined ? schedule.is_deleted : scheduleRecord.is_deleted;
      scheduleRecord.is_removed = schedule.is_removed != undefined ? schedule.is_removed : scheduleRecord.is_removed;
      scheduleRecord.save((saveError, saveCharge) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a day schedule",
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(saveCharge));
      });
    });
  }
}

/**
 * Checks for day schedule existence
 *
 * @param {Object} query - The day schedule findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckDaySchedule(query, callback) {
  DaySchedule.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding day schedule",
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

module.exports = DayScheduleService;
