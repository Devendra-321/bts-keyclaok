'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const UserDiscountCardSchema = new Schema(
  {
    'user_id': {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    'card_id': {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    'card_number': {
      type: String
    },
    'is_removed': {
      type: Boolean,
      default: false
    }
  },
  {
    collection: 'UserDiscountCard',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('UserDiscountCard', UserDiscountCardSchema);