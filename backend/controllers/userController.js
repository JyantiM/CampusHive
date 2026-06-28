const User = require('../models/User');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Quiz = require('../models/Quiz');
const Activity = require('../models/Activity');

// @desc    Retrieve user profile stats and populate tracking histories
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error retrieving profile context.' });
  }
};

// @desc    Update basic student profile settings
// @route   PUT /api/users/profile/update
// @access  Private
const updateProfile = async (req, res) => {
  const { name, branch, year } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (branch) user.branch = branch;
    if (year) user.year = year;

    await user.save();

    await Activity.create({
      userId: req.user.id,
      type: 'system',
      description: 'Profile settings updated.'
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        karmaScore: user.karmaScore,
        followedSubjects: user.followedSubjects
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// @desc    Toggle bookmark status for materials
// @route   POST /api/users/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  const { type, refId } = req.body;

  if (!type || !refId) {
    return res.status(400).json({ success: false, message: 'Please specify material type and refId.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if bookmark exists
    const index = user.bookmarks.findIndex(b => b.type === type && b.refId.toString() === refId);

    let bookmarked = false;
    if (index > -1) {
      // Remove bookmark
      user.bookmarks.splice(index, 1);
    } else {
      // Add bookmark
      user.bookmarks.push({ type, refId });
      bookmarked = true;
    }

    await user.save();

    // Resolve title for audit log
    let title = 'Resource';
    if (type === 'note') {
      const note = await Note.findById(refId);
      if (note) title = note.title;
    } else if (type === 'pyq') {
      const pyq = await PYQ.findById(refId);
      if (pyq) title = pyq.title;
    } else if (type === 'quiz') {
      const quiz = await Quiz.findById(refId);
      if (quiz) title = quiz.title;
    }

    await Activity.create({
      userId: req.user.id,
      type: 'bookmark',
      description: bookmarked ? `Bookmarked resource: "${title}"` : `Removed bookmark for: "${title}"`,
      link: `${type}:${refId}`
    });

    res.status(200).json({ success: true, bookmarks: user.bookmarks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
};

// @desc    Fetch activities audit log history
// @route   GET /api/users/activities
// @access  Private
const getActivityFeed = async (req, res) => {
  try {
    // Return last 30 activities
    const feed = await Activity.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({ success: true, activities: feed });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve activity feed.' });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  toggleBookmark,
  getActivityFeed
};
