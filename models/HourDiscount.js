'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const HourDiscountSchema = new Schema(
  {
    'discount': {
      type: Number
    },
    'type': {
      type: String,
      enum: ['FLAT', 'PERCENTAGE'],
      default: 'FLAT'
    },
    'day_time': {
      type: Object
    },
    'min_order_value': {
      type: Number
    },
    'created_by': {
      type: mongoose.Schema.Types.ObjectId,
      required: true
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
    collection: 'HourDiscount',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('HourDiscount', HourDiscountSchema);