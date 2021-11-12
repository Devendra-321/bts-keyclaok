'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const DeliveryChargeTypeSchema = new Schema(
  {
    'type': {
      type: String,
      enum: ['POSTCODE', 'AREA', 'SPENDING'],
      default: 'POSTCODE'
    },
    created_by: {
      type: String,
      required: true,
    },
    'is_deleted': {
      type: Boolean,
      default: false
    },
  },
  {
    collection: 'DeliveryChargeType',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('DeliveryChargeType', DeliveryChargeTypeSchema);