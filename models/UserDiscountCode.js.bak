'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const UserDiscountCodeSchema = new Schema(
  {
    'order_id': {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    'user_id': {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    'code': {
      type: String
    }
  },
  {
    collection: 'UserDiscountCode',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('UserDiscountCode', UserDiscountCodeSchema);