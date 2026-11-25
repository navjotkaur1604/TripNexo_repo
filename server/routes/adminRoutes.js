const express = require('express');
const { getDashboard, getUsers, getAllTrips } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/trips', getAllTrips);

module.exports = router;
