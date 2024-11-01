const mongoose = require('mongoose');

const RationaleSchema = new mongoose.Schema({
  RationaleID: { type: Number, required: true, unique: true },
  Module: { type: String, default: 'Medical Review' },
  Source: { type: String },
  RationaleSummary: { type: String, required: true },
  RationaleText: { type: String, required: true },
  Enable: { type: Boolean, default: true },
  GroupID: { type: Number, enum: [0, 1, 2, 3, 4, 5], required: true },
  Sequence: { type: Number },
});

module.exports = mongoose.model('Rationale', RationaleSchema);
