'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const FilterTypeSchema = new Schema(
  {
    'name': {
      type: String,
      required: true
    },
    created_by: {
      type: String,
      required: true,
    },
    'is_deleted': {
      type: Boolean,
      default: false
    },
    'is_removed': {
      type: Boolean,
      default: false
    },
  },
  {
    collection: 'FilterType',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('FilterType', FilterTypeSchema);