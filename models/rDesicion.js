const mongoose = require('mongoose');

const DecisionSchema = new mongoose.Schema({
  DecisionText: { type: String, required: true },
  RationaleID:{
    type: Number,
    ref: 'Rationale',
    required: true,
  },
  RationaleDecisionID:{ type:Number}
});

module.exports = mongoose.model('Decision', DecisionSchema);
