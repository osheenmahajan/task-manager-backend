require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({}).select("-password");
    console.log("Users in database:", users);

    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
};

listUsers();
