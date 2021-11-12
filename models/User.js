'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    '_id':{
      type:Object
    },
    'name': {
      type: String
    },
    'email': {
      type: String,
      required: true
    },
    'password': {
      type: String,
      required: true
    },
    'profile_img': {
      type: String
    },
    'contact_number': {
      type: String
    },
    'address_details': {
      type: Object
    },
    'role': {
      type: String,
      enum: ['admin', 'user', 'super_admin'],
      default: 'user'
    },
    'last_login_at': {
      type: Date
    },
    'is_email_verified': {
      type: Boolean,
      default: false
    },
    'is_deleted': {
      type: Boolean,
      default: false
    },
    'reset_token': {
      type: String
    },
    'reset_token_expiry': {
      type: Date
    }
  },
  {
    collection: 'User',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('User', UserSchema);

