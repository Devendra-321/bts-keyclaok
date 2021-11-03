'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const OrderValueSchema = new Schema(
  {
    'order_type': {
      type: String,
      enum: ['PICK_UP', 'DELIVERY', 'CATERING', 'DEPOSIT'],
      default: 'PICK_UP'
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
    collection: 'OrderValue',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('OrderValue', OrderValueSchema);