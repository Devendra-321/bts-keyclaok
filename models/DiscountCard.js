'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const DiscountCardSchema = new Schema(
  {
    'name': {
      type: String
    },
    'code': {
      type: String
    },
    'image': {
      type: String
    },
    'price': {
      type: Number
    },
    'amount': {
      type: Number
    },
    'discount': {
      type: Number
    },
    'type': {
      type: String,
      enum: ['FLAT', 'PERCENTAGE'],
      default: 'FLAT'
    },
    'card_type': {
      type: String,
      enum: ['GIFT_CARD', 'VOUCHER', 'COUPON'],
      default: 'GIFT_CARD'
    }, 
    'min_order_value': {
      type: Number
    },
    'expiry_date': {
      type: Date
    },
    'expiry_day': {
      type: Number
    },
  
    created_by: {
      type: String,
      required: true,
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    'is_removed': {
      type: Boolean,
      default: false
    }
  },
  {
    collection: 'DiscountCard',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('DiscountCard', DiscountCardSchema);