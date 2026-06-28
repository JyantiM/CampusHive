const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserProfile,
  updateProfile,
  toggleBookmark,
  getActivityFeed
} = require('../controllers/userController');

router.get('/profile', protect, getUserProfile);
router.put('/profile/update', protect, updateProfile);
router.post('/bookmark', protect, toggleBookmark);
router.get('/activities', protect, getActivityFeed);

module.exports = router;
