"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const FoodTypeSchema = new Schema(
  {
    'name': {
      type: String
    },
    'avatar_url': {
      type: String,
    },
    'created_by': {
      type: String,
      required: true
    },
    'is_deleted': {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "FoodType",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("FoodType", FoodTypeSchema);
