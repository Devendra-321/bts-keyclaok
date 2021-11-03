'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const FlagSchema = new Schema(
  {
    'name': {
      type: String
    },
    'description': {
      type: String
    },
    'value': {
      type: String
    },
    'options': [{
      type: String
    }]
  },
  {
    collection: 'Flag',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('Flag', FlagSchema);

