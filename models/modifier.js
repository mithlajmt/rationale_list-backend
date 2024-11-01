const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ModifierSchema = new Schema({
    ModifierList: {}, // Ensure the type is correct
    RationaleID:{
        type: Number,
        ref: 'Rationale',
        required: true,
      },});

module.exports = mongoose.model('Modifier', ModifierSchema);
