const mongoose = require('mongoose');

const SpecialtySchema = new mongoose.Schema({
  SpecialtyCode: { type: String, required: true, },
  Enable: { type: Boolean, default: true },
  RationaleID:{
    type: Number,
    ref: 'Rationale',
    required: true,
  },
  RationaleSpecialtyID:{ type:Number}
});

module.exports = mongoose.model('Specialty', SpecialtySchema);
