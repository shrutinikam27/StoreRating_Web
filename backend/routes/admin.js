const express = require('express');
const router = express.Router();
const { getDashboardStats, createUser, getStores, getUsers, getUserDetails } = require('../controllers/adminController');
const { validateRegistration } = require('../middlewares/validate');
const { protect, authorize } = require('../middlewares/auth');

// All admin routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.post('/users', validateRegistration, createUser);
router.get('/stores', getStores);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);

module.exports = router;
