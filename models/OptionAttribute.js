'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const OptionAttributeSchema = new Schema(
  {
    'name': {
      type: String
    }, 
    'price': {
      type: Number
    },
    'option_id': {
      type: mongoose.Schema.Types.ObjectId,
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
    collection: 'OptionAttribute',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('OptionAttribute', OptionAttributeSchema);