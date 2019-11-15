const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let SearchResultSchema = new Schema({
  searchId: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  data: {
    type: String,
    required: true,
    default: "This is some dummy data."
  }
});

module.exports = mongoose.model("SearchResult", SearchResultSchema);
