const UserM = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Set a secret key for JWT (ensure this is stored securely in your environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'onedayislongyears';

// Register User
const registerUser = async (req, res) => {
    console.log(req.body);
    try {
        const { userName, email, password, user_type } = req.body;
        const role = user_type
        const existingUser = await UserM.findOne({
            $or: [{ userName }, { email }]  
        });

        if (existingUser) {
            return res.status(400).send({
                success:false,
                message: 'User with these credentials already exists',
            });
        }

        // Hash the password
        const hashedPass = await bcrypt.hash(password, 10);

        // Proceed with registration if no user found
        const newUser = new UserM({ userName, email, password: hashedPass,role });
        await newUser.save();

        // Create a JWT token
        const token = jwt.sign(
            { id: newUser._id, userName: newUser.userName, email: newUser.email,role: newUser.role},
            JWT_SECRET,
            { expiresIn: '1h' } 
        );

        return res.status(201).json({
            message: "User registered successfully!",
            token,
            success:true,
            role:role
        });
        
    } catch (e) {
        console.error(e);
        res.status(500).send({
            message: 'Error registering user',
            error: e.message,
            succes: false
        });
    }
};


const login = async (req, res) => {
    console.log(req.body);
    try {
        const { userNameOrEmail, password } = req.body;

        // Find the user by username
        const user = await UserM.findOne({ 
            $or:[{email:userNameOrEmail},{username:userNameOrEmail}]
         });

        if (!user) {
            return res.status(400).send({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create a JWT token
        const token = jwt.sign(
            { id: user._id, userName: user.userName, email: user.email,role:user.role },
            JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        return res.status(200).json({
            message: "User logged in successfully!",
            token,
            role:user.role,
            success: true
        });
        
    } catch (e) {
        console.error(e);
        res.status(500).send({
            message: 'Error logging in',
            error: e.message,
            success: false
        });
    }
};

module.exports = {
    registerUser,
    login,
};
