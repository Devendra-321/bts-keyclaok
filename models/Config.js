'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const ConfigSchema = new Schema(
  {
    'configs': {
      type: Object
    },
    'type': {
      type: String,
      enum: ['SMTP']
    },
    created_by: {
      type: String,
      required: true,
    },
    'is_deleted': {
      type: Boolean,
      default: false
    },
  },
  {
    collection: 'Config',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('Config', ConfigSchema);