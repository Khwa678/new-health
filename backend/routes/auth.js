const express = require("express");
const router = express.Router();

// ✅ REGISTER
router.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  res.json({
    message: "Registered successfully",
    user: { email },
  });
});

// ✅ LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({
    message: "Login successful",
    user: { email },
  });
});

module.exports = router;