'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const ItemSchema = new Schema(
  {
    'name': {
      type: String,
      required: true
    },
    'category_id': {
      type: mongoose.Schema.Types.ObjectId
    },
    'sub_category_id': {
      type: mongoose.Schema.Types.ObjectId
    },
    'panel_type': {
      type: String,
      enum: ['E-COM', 'MERCHANDISE', 'CATERING'],
      default: 'E-COM'
    },
    'filters': {
      type: Object
    },
    'food_type_ids': [
      {
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    'created_by': {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    'item_images': [{type: String}],
    'description': {
      type: String
    },
    'online_price': {
      type: Number
    },
    'table_price': {
      type: Number
    },
    'tw_price': {
      type: Number
    },
    'is_web': {
      type: Boolean,
      default: true
    },
    'is_tw': {
      type: Boolean,
      default: true
    },
    'is_discount_applied': {
      type: Boolean,
      default: false
    },
    'auto_discount': {
      type: Boolean,
      default: false
    },
    'is_deleted': {
      type: Boolean,
      default: false
    },
    'is_removed': {
      type: Boolean,
      default: false
    },
    'buy_one_get_one': {
      type: Boolean,
      default: false
    },
    'half_price': {
      type: Boolean,
      default: false
    },
    'has_tax': {
      type: Boolean,
      default: false
    },
    'is_added_to_cart': {
      type: Boolean,
      default: true
    },
    'options': [
      {
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    'order': {
      type: Number
    },
    'is_promoted': {
      type: Boolean,
      default: false
    },
  },
  {
    collection: 'Item',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('Item', ItemSchema);