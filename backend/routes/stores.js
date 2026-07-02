const express = require('express');
const router = express.Router();
const { listStores, submitRating, modifyRating, getOwnerDashboard } = require('../controllers/storeController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/stores', protect, authorize('user', 'admin'), listStores);
router.post('/ratings', protect, authorize('user'), submitRating);
router.put('/ratings/:storeId', protect, authorize('user'), modifyRating);
router.get('/owner/dashboard', protect, authorize('store_owner'), getOwnerDashboard);

module.exports = router;
