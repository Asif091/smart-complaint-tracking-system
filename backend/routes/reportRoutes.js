const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDepartmentStats } = require('../controllers/reportController');

// All report routes require authentication and admin role
router.get('/department-stats', protect, getDepartmentStats);

module.exports = router;