const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { userName, email, password, authType, googleId, googleProfile, profilePic } = req.body;

        if (!email || !authType) return res.status(400).json({ msg: "Missing fields" });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ msg: "User already exists" });

        let newUser;
        if (authType === "local") {
            if (!password) return res.status(400).json({ msg: "Password is required for local authentication" });
            const hashedPassword = await bcrypt.hash(password, 10);
            newUser = new User({ userName, email, password: hashedPassword, authType, profilePic });
        } else if (authType === "google") {
            if (!googleId || !googleProfile) return res.status(400).json({ msg: "Google authentication details required" });
            newUser = new User({ userName, email, googleId, googleProfile, authType, profilePic });
        } else {
            return res.status(400).json({ msg: "Invalid authentication type" });
        }

        await newUser.save();
        res.status(201).json({ msg: "User registered successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password, authType, googleId } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "User not found" });

        if (authType === "local") {
            if (!password) return res.status(400).json({ msg: "Password is required for local login" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
        } else if (authType === "google") {
            if (!googleId || googleId !== user.googleId) return res.status(400).json({ msg: "Invalid Google authentication" });
        } else {
            return res.status(400).json({ msg: "Invalid authentication type" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user).select("-password");
        if (!user) return res.status(404).json({ msg: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
