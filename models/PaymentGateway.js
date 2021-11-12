'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const PaymentGatewaySchema = new Schema(
  {
    'client_id': {
      type: String
    },
    'secret_key': {
      type: String
    },
    'type': {
      type: String,
      enum: ['STRIPE', 'PAYPAL', 'SQUARE']
    },
    'is_test': {
      type: Boolean,
      default: true
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
    collection: 'PaymentGateway',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('PaymentGateway', PaymentGatewaySchema);