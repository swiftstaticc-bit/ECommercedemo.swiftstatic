'use strict';

const express = require('express');
const router = express.Router();
const { placeOrder } = require('../controllers/orderController');

// POST /api/order
router.post('/order', placeOrder);

module.exports = router;
