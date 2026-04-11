require('dotenv').config();
const mongoose = require('mongoose');
const Quote = require('./models/Quote');
const connectDB = require('./config/db');

const seedQuotes = [
  // ===== QURAN VERSES =====
  {
    text: 'Verily, with hardship, there is relief.',
    sourceType: 'Quran',
    reference: 'Surah Ash-Sharh 94:6',
    author: null,
    mood: ['hopeful', 'peaceful'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'And He found you lost and guided you.',
    sourceType: 'Quran',
    reference: 'Surah Ad-Duha 93:7',
    author: null,
    mood: ['grateful', 'hopeful'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'Allah does not burden a soul beyond that it can bear.',
    sourceType: 'Quran',
    reference: 'Surah Al-Baqarah 2:286',
    author: null,
    mood: ['hopeful', 'calm'],
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'So remember Me; I will remember you.',
    sourceType: 'Quran',
    reference: 'Surah Al-Baqarah 2:152',
    author: null,
    mood: ['peaceful', 'grateful'],
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'Indeed, Allah is with the patient.',
    sourceType: 'Quran',
    reference: 'Surah Al-Baqarah 2:153',
    author: null,
    mood: ['calm', 'hopeful'],
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'And whoever puts their trust in Allah, then He will suffice him.',
    sourceType: 'Quran',
    reference: 'Surah At-Talaq 65:3',
    author: null,
    mood: ['peaceful', 'hopeful'],
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'My mercy encompasses all things.',
    sourceType: 'Quran',
    reference: 'Surah Al-A\'raf 7:156',
    author: null,
    mood: ['grateful', 'peaceful', 'calm'],
    imageUrl: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'And We have certainly made the Quran easy for remembrance, so is there any who will remember?',
    sourceType: 'Quran',
    reference: 'Surah Al-Qamar 54:17',
    author: null,
    mood: ['reflective', 'inspired'],
    imageUrl: 'https://images.unsplash.com/photo-1476842634003-7dcca8f832de?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },

  // ===== BOOK QUOTES =====
  {
    text: 'The wound is the place where the Light enters you.',
    sourceType: 'Book',
    reference: 'The Essential Rumi',
    author: 'Rumi',
    mood: ['hopeful', 'reflective', 'inspired'],
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'What you seek is seeking you.',
    sourceType: 'Book',
    reference: 'The Essential Rumi',
    author: 'Rumi',
    mood: ['motivational', 'inspired'],
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'And, when you want something, all the universe conspires in helping you to achieve it.',
    sourceType: 'Book',
    reference: 'The Alchemist',
    author: 'Paulo Coelho',
    mood: ['motivational', 'hopeful', 'inspired'],
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'It is only with the heart that one can see rightly; what is essential is invisible to the eye.',
    sourceType: 'Book',
    reference: 'The Little Prince',
    author: 'Antoine de Saint-Exupery',
    mood: ['reflective', 'peaceful'],
    imageUrl: 'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'Not all those who wander are lost.',
    sourceType: 'Book',
    reference: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    mood: ['inspired', 'reflective'],
    imageUrl: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'When you light a candle, you also cast a shadow.',
    sourceType: 'Book',
    reference: 'A Wizard of Earthsea',
    author: 'Ursula K. Le Guin',
    mood: ['reflective', 'calm'],
    imageUrl: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },

  // ===== MOVIE QUOTES =====
  {
    text: 'It is not our abilities that show what we truly are. It is our choices.',
    sourceType: 'Movie',
    reference: 'Harry Potter and the Chamber of Secrets',
    author: 'Albus Dumbledore',
    mood: ['motivational', 'reflective'],
    imageUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'After all, tomorrow is another day.',
    sourceType: 'Movie',
    reference: 'Gone with the Wind',
    author: 'Scarlett O\'Hara',
    mood: ['hopeful', 'motivational'],
    imageUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'The flower that blooms in adversity is the most rare and beautiful of all.',
    sourceType: 'Movie',
    reference: 'Mulan',
    author: 'The Emperor',
    mood: ['motivational', 'hopeful', 'inspired'],
    imageUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'Oh yes, the past can hurt. But the way I see it, you can either run from it or learn from it.',
    sourceType: 'Movie',
    reference: 'The Lion King',
    author: 'Rafiki',
    mood: ['motivational', 'reflective', 'hopeful'],
    imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },

  // ===== POEMS =====
  {
    text: 'Do not go gentle into that good night. Rage, rage against the dying of the light.',
    sourceType: 'Poem',
    reference: 'Do not go gentle into that good night',
    author: 'Dylan Thomas',
    mood: ['motivational', 'angry', 'inspired'],
    imageUrl: 'https://images.unsplash.com/photo-1472120435266-95a3f747eb08?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
  {
    text: 'Two roads diverged in a wood, and I — I took the one less traveled by, and that has made all the difference.',
    sourceType: 'Poem',
    reference: 'The Road Not Taken',
    author: 'Robert Frost',
    mood: ['reflective', 'inspired'],
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=640&q=80',
    isSystem: true,
    isPublic: true,
  },
];

async function seed() {
  try {
    await connectDB();

    const existing = await Quote.countDocuments({ isSystem: true });
    if (existing > 0) {
      console.log(`Already seeded (${existing} system quotes). Skipping.`);
      process.exit(0);
    }

    await Quote.insertMany(seedQuotes);
    console.log(`Seeded ${seedQuotes.length} quotes successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
