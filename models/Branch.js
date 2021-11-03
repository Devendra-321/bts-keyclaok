'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const BranchSchema = new Schema(
  {
    'name': {
      type: String
    },
    'website': {
      type: String
    },
    'map': {
      type: String
    },
    'image_url': {
      type: String
    },
    'address': {
      type: Object
    },
    'created_by': {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    'is_deleted': {
      type: Boolean,
      default: false
    }
  },
  {
    collection: 'Branch',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('Branch', BranchSchema);