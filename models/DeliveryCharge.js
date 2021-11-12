'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const DeliveryChargeSchema = new Schema(
  {
    'tax': {
      type: Number
    },
    'type': {
      type: String,
      enum: ['FLAT', 'PERCENTAGE'],
      default: 'FLAT'
    },
    'charge_type': {
      type: String,
      enum: ['POSTCODE', 'AREA', 'SPENDING'],
      default: 'SPENDING'
    },
    'postcode': {
      type: String
    },
    'area': {
      type: String
    },
    'min_order_value': {
      type: Number
    },
    'max_order_value': {
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
    },
    'branch_id': {
      type: mongoose.Schema.Types.ObjectId
    },
  },
  {
    collection: 'DeliveryCharge',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('DeliveryCharge', DeliveryChargeSchema);