// models/DecisonList.js
const mongoose = require('mongoose');

const DecisionListSchema = new mongoose.Schema({
    DecisionText: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('DecisonList', DecisionListSchema);
