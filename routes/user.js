const express = require('express');
const router = express.Router();
const {getCompleteRationale,updateRationale,getRationaleData,getDecisionList,getSpecialityList}= require('./../controllers/rationalController');


router.get('/decisions',getDecisionList);
router.get('/specialities',getSpecialityList);

router.get('/rationale',getCompleteRationale);
router.get('/rationale/:id',getRationaleData);
router.put('/rationale/:id',updateRationale);

module.exports = router

