const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const ctrl = require('../controllers/quotesController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// --- Multer config for image uploads ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(12).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
  },
});

// --- Validation rules ---
const quoteRules = [
  body('text').trim().notEmpty().withMessage('Quote text is required'),
  body('sourceType')
    .optional()
    .isIn(['Quran', 'Book', 'Movie', 'Poem', 'Other'])
    .withMessage('Invalid source type'),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// --- PUBLIC routes (no auth required) ---
router.get('/stats/moods', ctrl.getMoodStats);

// --- PROTECTED routes that must come before /:id ---
router.get('/my/quotes', auth, ctrl.getMyQuotes);
router.get('/my/saved-ids', auth, ctrl.getSavedIds);
router.get('/stats/dashboard', auth, ctrl.getDashboard);

// --- PUBLIC routes ---
router.get('/', optionalAuth, ctrl.getQuotes);
router.get('/:id', optionalAuth, ctrl.getQuote);

// --- PROTECTED CRUD ---
router.post('/', auth, upload.single('image'), quoteRules, validate, ctrl.createQuote);
router.put('/:id', auth, upload.single('image'), ctrl.updateQuote);
router.delete('/:id', auth, ctrl.deleteQuote);
router.post('/:id/save', auth, ctrl.saveQuote);
router.delete('/:id/save', auth, ctrl.unsaveQuote);

module.exports = router;
