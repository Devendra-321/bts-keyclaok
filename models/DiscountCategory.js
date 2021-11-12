'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const DiscountCategorySchema = new Schema(
  {
    'discount': {
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
    },
    'discount_type': {
      type: String,
      enum: ['ONE_TIME_SUBSCRIBER', 'PAYMENT_TYPE', 'REDUNDANT_CART'],
      default: 'ONE_TIME_SUBSCRIBER'
    },
    'payment_type': {
      type: String,
      enum: ['CARD', 'WALLET', 'CASH', 'ALL']
    },
    'expiry_time': {
      type: Number
    },
  },
  {
    collection: 'DiscountCategory',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('DiscountCategory', DiscountCategorySchema);