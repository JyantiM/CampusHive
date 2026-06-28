const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

// @desc    Retrieve doubt threads by subject
// @route   GET /api/doubts/:subject
// @access  Public
const getDoubts = async (req, res) => {
  const { subject } = req.params;

  try {
    const threads = await Doubt.find({ subject }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, doubts: threads });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve doubts.' });
  }
};

// @desc    Post a new academic doubt
// @route   POST /api/doubts/create
// @access  Private
const postDoubt = async (req, res) => {
  const { subject, question, anonymous } = req.body;

  if (!subject || !question) {
    return res.status(400).json({ success: false, message: 'Please specify subject and doubt description.' });
  }

  try {
    const doubt = await Doubt.create({
      subject,
      question,
      askedBy: req.user.id,
      username: anonymous ? 'Anonymous Student' : req.user.name,
      anonymous: !!anonymous
    });

    // Register activity log
    await Activity.create({
      userId: req.user.id,
      type: 'doubt',
      description: `Asked a doubt in subject "${subject}": "${question.slice(0, 40)}..."`,
      link: `doubt:${doubt._id}`
    });

    // Notify subject followers
    const followers = await User.find({ followedSubjects: subject });
    const notificationDocs = followers.map(user => ({
      userId: user._id,
      message: `New doubt posted in followed subject ${subject}: "${question.slice(0, 50)}..."`,
      type: 'doubt',
      link: `doubt:${doubt._id}`,
      read: false
    }));

    if (notificationDocs.length > 0) {
      await Notification.insertMany(notificationDocs);
    }

    res.status(201).json({ success: true, doubt });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to post doubt.' });
  }
};

// @desc    Post an answer/reply to a doubt
// @route   POST /api/doubts/reply/:id
// @access  Private
const postAnswer = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: 'Please enter reply content.' });
  }

  try {
    const doubt = await Doubt.findById(id);
    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt thread not found.' });
    }

    // Append answer array
    doubt.answers.push({
      answeredBy: req.user.id,
      username: req.user.name,
      text
    });

    await doubt.save();

    // Register activity
    await Activity.create({
      userId: req.user.id,
      type: 'doubt',
      description: `Replied to doubt thread: "${text.slice(0, 40)}..."`,
      link: `doubt:${id}`
    });

    // Notify user who asked doubt (if not answering own and not anonymous asked)
    if (doubt.askedBy && doubt.askedBy.toString() !== req.user.id) {
      await Notification.create({
        userId: doubt.askedBy,
        message: `${req.user.name} replied to your doubt in ${doubt.subject}.`,
        type: 'answer',
        link: `doubt:${id}`
      });
    }

    res.status(200).json({ success: true, doubt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to post reply.' });
  }
};

// @desc    Toggle follow subject
// @route   POST /api/doubts/follow
// @access  Private
const followSubjectToggle = async (req, res) => {
  const { subject } = req.body;

  if (!subject) {
    return res.status(400).json({ success: false, message: 'Please provide subject name.' });
  }

  try {
    const user = await User.findById(req.user.id);
    const index = user.followedSubjects.indexOf(subject);

    let followed = false;
    if (index > -1) {
      // Unfollow
      user.followedSubjects.splice(index, 1);
    } else {
      // Follow
      user.followedSubjects.push(subject);
      followed = true;
    }

    await user.save();

    await Activity.create({
      userId: req.user.id,
      type: 'follow',
      description: followed ? `Started following subject "${subject}"` : `Unfollowed subject "${subject}"`,
      link: `subject:${subject}`
    });

    res.status(200).json({ success: true, followedSubjects: user.followedSubjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update subject follow.' });
  }
};

// @desc    Fetch notifications for active user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

// @desc    Delete/Dismiss notification
// @route   DELETE /api/doubts/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.status(200).json({ success: true, message: 'Notification dismissed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to dismiss notification.' });
  }
};

module.exports = {
  getDoubts,
  postDoubt,
  postAnswer,
  followSubjectToggle,
  getNotifications,
  markNotificationRead,
  deleteNotification
};
