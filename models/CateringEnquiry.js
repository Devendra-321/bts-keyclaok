'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const CateringEnquirySchema = new Schema(
  {
    'name': {
      type: String
    },
    'mobile': {
      type: String
    },
    'address': {
      type: String
    },
    'email': {
      type: String,
      required: true
    },
    'postcode': {
      type: String,
      required: true
    },
    'item_id': [{
      type: mongoose.Schema.Types.ObjectId
    }],
    'message': {
      type: String
    },
    'is_deleted': {
      type: Boolean,
      default: false
    },
  },
  {
    collection: 'CateringEnquiry',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('CateringEnquiry', CateringEnquirySchema);

