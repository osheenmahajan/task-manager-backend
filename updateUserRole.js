require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const updateUserRole = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/taskmanager';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const user = await User.findOneAndUpdate(
      { username: "MANVIR" },
      { role: "member" },
      { new: true }
    );

    if (user) {
      console.log("User updated:", user);
    } else {
      console.log("User not found");
    }

    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
};

updateUserRole();
