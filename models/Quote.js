const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Quote text is required'],
      trim: true,
    },
    sourceType: {
      type: String,
      required: true,
      enum: ['Quran', 'Book', 'Movie', 'Poem', 'Other'],
      default: 'Other',
    },
    reference: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    mood: {
      type: [String],
      default: [],
    },
    image: {
      type: String,   // filename or external URL
      default: null,
    },
    imageUrl: {
      type: String,   // external image URL (e.g. Unsplash)
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
quoteSchema.index({ text: 'text', author: 'text', reference: 'text' });

module.exports = mongoose.model('Quote', quoteSchema);
