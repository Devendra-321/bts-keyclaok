'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const ServiceChargeSchema = new Schema(
  {
    'tax': {
      type: Number
    },
    'type': {
      type: String,
      enum: ['FLAT', 'PERCENTAGE'],
      default: 'FLAT'
    },
    'min_order_value': {
      type: Number
    },
    'created_by': {
      type: String,
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
    collection: 'ServiceCharge',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('ServiceCharge', ServiceChargeSchema);