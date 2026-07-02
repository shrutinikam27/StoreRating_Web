const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword } = require('../controllers/authController');
const { validateRegistration, validatePasswordUpdate } = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');

router.post('/register', validateRegistration, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/password', protect, validatePasswordUpdate, updatePassword);

module.exports = router;
