'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const ReviewSchema = new Schema(
  {
    'name': {
      type: String
    },
    'email': {
      type: String,
      required: true
    },
    'designation': {
      type: String,
      required: true
    },
    'profile_img': {
      type: String
    },
    'message': {
      type: String
    },
    'rate': {
      type: Number
    },
    'is_highlighted': {
      type: Boolean,
      default: false
    },
    'is_deleted': {
      type: Boolean,
      default: false
    },
  },
  {
    collection: 'Review',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('Review', ReviewSchema);

