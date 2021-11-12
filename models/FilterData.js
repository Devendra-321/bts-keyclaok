'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const FilterDataSchema = new Schema(
  {
    'name': {
      type: String,
      required: true
    },
    'filter_type_id': {
      type: String
    },
    created_by: {
      type: String,
      required: true,
    },
    'is_deleted': {
      type: Boolean,
      default: false
    }
  },
  {
    collection: 'FilterData',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('FilterData', FilterDataSchema);