 const mongoose = require('mongoose');
 const validator = require('validator');

 const userSchema = new mongoose.Schema({
    userName:{
        type: String,
        required: true,
        unique: [true, 'userName aleady exist'],
        // validate: [validator.isAlphanumeric, 'Username must contain only alphanumeric characters']
    },
    email:{
        type: String,
        required: true,
        unique: true,
        validate: validator.isEmail
    },
    password:{
        type: String,
        required: true,
        minlength: 8,
        // validate: validator.isStrongPassword
    },
    role:{
        type: String,
        default: 'user',
        enum: ['user', 'admin'] 
    }
 })

 const User = mongoose.model('User',userSchema);

 module.exports = User;