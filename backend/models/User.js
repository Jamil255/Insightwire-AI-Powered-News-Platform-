const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Only for 'local' authentication
    profilePic: { type: String },
    authType: { type: String, enum: ["local", "google"], required: true },
    googleId: { type: String }, // Only for Google auth
    googleProfile: { type: Object }, // Store Google profile details if needed
    role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);