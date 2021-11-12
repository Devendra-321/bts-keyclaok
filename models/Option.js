'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const OptionSchema = new Schema(
  {
    'name': {
      type: String
    },
    'max_qty': {
      type: Number
    },
    'is_multi_selected': {
      type: Boolean,
      default: true
    },
    'created_by': {
      type: String,
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
    collection: 'Option',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('Option', OptionSchema);