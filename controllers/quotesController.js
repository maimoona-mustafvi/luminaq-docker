const fs = require('fs');
const path = require('path');
const Quote = require('../models/Quote');

// GET /api/quotes  — PUBLIC: browse all public + system quotes
exports.getQuotes = async (req, res, next) => {
  try {
    const filter = { $or: [{ isSystem: true }, { isPublic: true }] };
    if (req.query.sourceType) filter.sourceType = req.query.sourceType;
    if (req.query.mood) filter.mood = { $in: req.query.mood.split(',') };
    if (req.query.search) filter.$text = { $search: req.query.search };

    const quotes = await Quote.find(filter)
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    next(err);
  }
};

// GET /api/quotes/my  — PRIVATE: user's own + saved quotes (auth required)
exports.getMyQuotes = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    const savedIds = user?.savedQuotes || [];

    const filter = { $or: [{ user: req.userId }, { _id: { $in: savedIds } }] };
    if (req.query.sourceType) filter.sourceType = req.query.sourceType;
    if (req.query.mood) filter.mood = { $in: req.query.mood.split(',') };
    if (req.query.search) filter.$text = { $search: req.query.search };

    const quotes = await Quote.find(filter)
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    next(err);
  }
};

// POST /api/quotes/:id/save — save a quote to user's collection
exports.saveQuote = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    await User.findByIdAndUpdate(req.userId, { $addToSet: { savedQuotes: quote._id } });
    res.json({ message: 'Quote saved' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/quotes/:id/save — unsave a quote from user's collection
exports.unsaveQuote = async (req, res, next) => {
  try {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.userId, { $pull: { savedQuotes: req.params.id } });
    res.json({ message: 'Quote unsaved' });
  } catch (err) {
    next(err);
  }
};

// GET /api/quotes/saved — get list of saved quote IDs for current user
exports.getSavedIds = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId).select('savedQuotes');
    res.json(user?.savedQuotes || []);
  } catch (err) {
    next(err);
  }
};

// GET /api/quotes/:id — public if system/public, or owner
exports.getQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('user', 'name');
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    // Allow if public/system or if user owns it
    if (!quote.isPublic && !quote.isSystem) {
      if (!req.userId || String(quote.user?._id) !== String(req.userId)) {
        return res.status(404).json({ error: 'Quote not found' });
      }
    }
    res.json(quote);
  } catch (err) {
    next(err);
  }
};

// POST /api/quotes  — create (auth required)
exports.createQuote = async (req, res, next) => {
  try {
    const data = {
      text: req.body.text,
      sourceType: req.body.sourceType,
      reference: req.body.reference,
      author: req.body.author,
      mood: req.body.mood ? JSON.parse(req.body.mood) : [],
      isPublic: req.body.isPublic !== 'false',
    };
    if (req.file) data.image = req.file.filename;
    data.user = req.userId;

    const quote = await Quote.create(data);
    res.status(201).json(quote);
  } catch (err) {
    next(err);
  }
};

// PUT /api/quotes/:id — update own quote (auth required)
exports.updateQuote = async (req, res, next) => {
  try {
    const existing = await Quote.findOne({ _id: req.params.id, user: req.userId });
    if (!existing) return res.status(404).json({ error: 'Quote not found' });
    if (existing.isSystem) return res.status(403).json({ error: 'Cannot edit system quotes' });

    const data = {
      text: req.body.text ?? existing.text,
      sourceType: req.body.sourceType ?? existing.sourceType,
      reference: req.body.reference ?? existing.reference,
      author: req.body.author ?? existing.author,
      mood: req.body.mood ? JSON.parse(req.body.mood) : existing.mood,
    };
    if (req.body.isPublic !== undefined) data.isPublic = req.body.isPublic !== 'false';

    if (req.file) {
      if (existing.image) {
        const oldPath = path.join(__dirname, '..', 'uploads', existing.image);
        fs.unlink(oldPath, () => {});
      }
      data.image = req.file.filename;
    }

    const updated = await Quote.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      data,
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/quotes/:id — delete own quote (auth required)
exports.deleteQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({ _id: req.params.id, user: req.userId });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.isSystem) return res.status(403).json({ error: 'Cannot delete system quotes' });

    await Quote.deleteOne({ _id: quote._id });

    if (quote.image) {
      const imgPath = path.join(__dirname, '..', 'uploads', quote.image);
      fs.unlink(imgPath, () => {});
    }

    res.json({ message: 'Quote deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/quotes/stats/moods — public mood stats
exports.getMoodStats = async (req, res, next) => {
  try {
    const stats = await Quote.aggregate([
      { $match: { $or: [{ isSystem: true }, { isPublic: true }] } },
      { $unwind: '$mood' },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

// GET /api/quotes/stats/dashboard — user's own dashboard (auth required)
exports.getDashboard = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const userFilter = { user: req.userId };
    const userMatch = { $match: { user: new mongoose.Types.ObjectId(req.userId) } };
    const [total, sourceStats, latest] = await Promise.all([
      Quote.countDocuments(userFilter),
      Quote.aggregate([
        userMatch,
        { $group: { _id: '$sourceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Quote.find(userFilter).sort({ createdAt: -1 }).limit(5),
    ]);
    res.json({ total, sourceStats, latest });
  } catch (err) {
    next(err);
  }
};
