const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware'); // Middleware to authenticate JWT

// User profile route
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Extracting user details from the authenticated request
    const user = req.user;

    return res.json({
      id: user.id, // Unique user ID
      firstName: user.firstName, // First name
      lastName: user.lastName, // Last name
      email: user.email, // Email address
      phone: user.phone, // Phone number
      country: user.country // Country
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;