'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const OrderSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    'item_details': [
      {
        type: Object
      }
    ],
    'order_type': {
      type: String,
      enum: ['DELIVERY', 'COLLECTION']
    },
    'time': {
      type: String
    },
    'address': {
      type: Object
    },
    'discount': { //{type: 'Happyhour/voucher/coupon/daydiscount', amount: 10$, code: 'TOPHAT123'}
      type: Object
    },
    'card_id': {
      type: String
    },
    'customer_id': {
      type: String
    },
    'transaction_id': {
      type: String
    },
    'payment_gateway': {
      type: String,
      enum: ['STRIPE', 'SQUARE', 'PAYPAL']
    },
    'tips': {
      type: Number
    },
    'bags': {
      type: Number
    },
    'notes': {
      type: String
    },
    'service_charge': {
      type: Number
    },
    'delivery_charge': {
      type: Number
    },
    'order_total': {
      type: Number
    },
    'order_number': {
      type: String
    },
    'status': {
      type: String,
      enum: ['InProgress', 'Delivered', 'Approved', 'Cancelled', 'Declined', 'Shipped'],
      default: 'InProgress'
    },
    'payment_status': {
      type: String,
      enum: ['Done', 'InProgress']
    },
    'payment_type': {
      type: String,
      enum: ['Cash', 'Card']
    },
    'panel_type': {
      type: String,
      enum: ['E-COM', 'MERCHANDISE', 'CATERING'],
      default: 'E-COM'
    },
  },
  {
    collection: 'Order',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('Order', OrderSchema);