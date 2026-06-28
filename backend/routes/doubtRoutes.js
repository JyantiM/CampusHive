const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getDoubts,
  postDoubt,
  postAnswer,
  followSubjectToggle,
  getNotifications,
  markNotificationRead,
  deleteNotification
} = require('../controllers/doubtController');

router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.delete('/notifications/:id', protect, deleteNotification);
router.post('/follow', protect, followSubjectToggle);
router.get('/:subject', getDoubts);
router.post('/create', protect, postDoubt);
router.post('/reply/:id', protect, postAnswer);

module.exports = router;
