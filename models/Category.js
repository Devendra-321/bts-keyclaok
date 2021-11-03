'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const CategorySchema = new Schema(
  {
    'name': {
      type: String,
      required: true
    },
    'description': {
      type: String
    },
    'order': {
      type: Number
    },
    'is_web': {
      type: Boolean,
      default: true
    },
    'allergy_ids': [
      {
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    'food_type_ids': [
      {
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    'is_tw': {
      type: Boolean,
      default: true
    },
    'is_discount_applied': {
      type: Boolean,
      default: false
    },
    'created_by': {
      type: String,
      required: true
    },
    'is_deleted': {
      type: Boolean,
      default: false
    },
    'panel_type': {
      type: String,
      enum: ['E-COM', 'MERCHANDISE', 'CATERING'],
      default: 'E-COM'
    },
  },
  {
    collection: 'Category',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('Category', CategorySchema);