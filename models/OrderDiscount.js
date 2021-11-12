'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const OrderDiscountSchema = new Schema(
  {
    'discount': {
      type: Number
    },
    'type': {
      type: String,
      enum: ['FLAT', 'PERCENTAGE'],
      default: 'FLAT'
    },
    'order_type': {
      type: String,
      enum: ['PICK_UP', 'DELIVERY'],
      default: 'PICK_UP'
    }, 
    'min_order_value': {
      type: Number
    },
    'created_by': {
      type:String,
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
    collection: 'OrderDiscount',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('OrderDiscount', OrderDiscountSchema);