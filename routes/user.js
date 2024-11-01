const express = require('express');
const router = express.Router();
const {getCompleteRationale,updateRationale}= require('./../controllers/rationalController');



router.get('/rationale',getCompleteRationale);
router.patch('/rationale/:id',updateRationale);

module.exports = router

