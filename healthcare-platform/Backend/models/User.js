// Backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Ensure bcryptjs is installed

const userSchema = mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed password
    role: {
      type: String,
      enum: ["patient", "doctor"],
      default: "patient"
    },
    location: { type: String, default: "" }, // e.g., city name
    // User profile details
    dob: { // Date of Birth
      type: Date,
    },
    securityQuestion: { // The user's selected security question
      type: String,
      // Consider using an enum of predefined questions for better security
    },
    securityAnswer: { // The HASH of the user's security answer
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password and security answer before saving or updating the fields
userSchema.pre("save", async function (next) {
  // If password was modified, hash it
  if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
  }

  // If securityAnswer was modified and provided, hash it
  if (this.isModified("securityAnswer") && this.securityAnswer) {
       const answerSalt = await bcrypt.genSalt(10);
       this.securityAnswer = await bcrypt.hash(this.securityAnswer, answerSalt);
  }

  next();
});

// Compare given password with the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare a given security answer with the hashed answer
userSchema.methods.matchSecurityAnswer = async function (enteredAnswer) {
    if (!this.securityAnswer) {
        return false; // Cannot match if no answer is stored
    }
    return await bcrypt.compare(enteredAnswer, this.securityAnswer);
};


module.exports = mongoose.model("User", userSchema);