const mongoose = require('mongoose');

const procedureSchema = new mongoose.Schema({
    serviceCodeFrom: {
    },
    serviceCodeTo: {
    },
    serviceCodeList: {
    },
    rationaleID: {
        type: Number,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Procedure', procedureSchema);
