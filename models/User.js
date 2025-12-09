const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, default: function() { return this.email.split('@')[0]; } },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImageUrl: { type: String, default: null },
    role: { type: String, enum: ["admin", "member"], default: "member" }, //Role-based Access
    },
    { timestamps: true}
);

// ...existing code...
module.exports = mongoose.model("User", UserSchema);
// ...existing code...