'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const CheckoutFacilitySchema = new Schema(
  {
    'name': {
      type: String
    },
    'value': {
      type: Number
    },
    'type': {
      type: String,
      enum: ['BAG', 'TIP', 'ORDER_NUMBER', 'GIFT_CARD_NUMBER'],
      default: 'BAG'
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
    collection: 'CheckoutFacility',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('CheckoutFacility', CheckoutFacilitySchema);