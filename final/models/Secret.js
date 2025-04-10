const mongoose = require("mongoose");

const secretSchema = new mongoose.Schema({
  secretId: String,
  password: String,
});

module.exports = mongoose.model("Secret", secretSchema);
