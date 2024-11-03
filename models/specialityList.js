const mongoose =  require('mongoose');

const specialityListSchema = new mongoose.Schema({
    SpecialtyCode: { type: String, required: true, unique: true },
})


module.exports = mongoose.model('SpecialtyList', specialityListSchema);