'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const CartSchema = new Schema(
  {
    'item_id': {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    'user_id': {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    'quantity': {
      type: Number
    }
  },
  {
    collection: 'Cart',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('Cart', CartSchema);