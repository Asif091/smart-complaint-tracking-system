/**
 * One-time script to create a first user (run when MongoDB is connected).
 * Usage: node scripts/seed-user.js
 * Or with custom data: NAME="Admin" EMAIL=admin@test.com PASSWORD=admin123 ROLE=admin node scripts/seed-user.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const name = process.env.NAME || "Test User";
const email = process.env.EMAIL || "test@example.com";
const password = process.env.PASSWORD || "password123";
const role = process.env.ROLE || "staff";

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("User already exists:", email);
    process.exit(0);
  }
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed, role });
  console.log("Created user:", email, "role:", role);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
