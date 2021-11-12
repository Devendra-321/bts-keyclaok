'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const DayScheduleSchema = new Schema(
  {
    'day': {
      type: String
    },
    'morning_time': {
      type: String
    },
    'evening_time': {
      type: String
    },
    created_by: {
      type: String,
      required: true,
    },
    'is_deleted': {
      type: Boolean,
      default: false
    },
    'is_removed': {
      type: Boolean,
      default: false
    }
  },
  {
    collection: 'DaySchedule',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('DaySchedule', DayScheduleSchema);