const express = require('express');
const { getMyNotifications, markRead, createNotification, markAllRead } = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.put('/mark-all-read', protect, markAllRead);
router.put('/:id/read', protect, markRead);

// Admin routes
router.post('/', protect, admin, createNotification);

module.exports = router;
