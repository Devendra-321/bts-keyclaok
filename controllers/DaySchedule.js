'use strict';

const DayScheduleService = require('../services/DayScheduleService');

/**
 * Creates a new schedule
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createDaySchedule = function createDaySchedule(req, res, next) {
  let dayScheduleService = new DayScheduleService(req.Logger);
  dayScheduleService.createDaySchedule(req, res, next);
};

/**
 * Get all schedules
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDayScheduleList = function getDayScheduleList(req, res, next) {
  let dayScheduleService = new DayScheduleService(req.Logger);
  dayScheduleService.getDayScheduleList(req.swagger.params, res, next);
};

/**
 * Get schedule with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDaySchedule = function getDaySchedule(req, res, next) {
  let dayScheduleService = new DayScheduleService(req.Logger);
  dayScheduleService.getDaySchedule(req.swagger.params, res, next);
};

/**
 * Update schedule with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateDaySchedule = function updateDaySchedule(req, res, next) {
  let dayScheduleService = new DayScheduleService(req.Logger);
  dayScheduleService.updateDaySchedule(req.swagger.params, res, next);
};