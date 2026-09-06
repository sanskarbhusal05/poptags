import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'poptags.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to PopTags SQLite database at:', dbPath);
  }
});

// Initialize database schema
db.serialize(() => {
  // Profiles table (Step 1 Data)
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      owner_name TEXT NOT NULL,
      shop_name TEXT NOT NULL,
      contact_no TEXT NOT NULL,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Links table (Step 2 Data)
  db.run(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT DEFAULT 'link',
      click_count INTEGER DEFAULT 0,
      position INTEGER DEFAULT 0,
      FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `);

  // Seed default demo profile if empty
  db.get(`SELECT COUNT(*) as count FROM profiles`, [], (err, row) => {
    if (row && row.count === 0) {
      const demoId = 'demo-shop';
      db.run(`
        INSERT INTO profiles (id, owner_name, shop_name, contact_no, bio)
        VALUES (?, ?, ?, ?, ?)
      `, [demoId, 'Rahul Sharma', 'Sharma Electronics', '+91 98765 43210', 'Best deals on Electronics, Accessories & Mobile Repair!']);

      const sampleLinks = [
        { title: 'Chat on WhatsApp', url: 'https://wa.me/919876543210?text=Hi%20Sharma%20Electronics!', type: 'whatsapp', position: 1 },
        { title: 'Shop Instagram Page', url: 'https://instagram.com', type: 'instagram', position: 2 },
        { title: 'Google Maps Location', url: 'https://maps.google.com', type: 'map', position: 3 },
        { title: 'Browse Product Catalog', url: 'https://sharmaelectronics.in', type: 'website', position: 4 }
      ];

      sampleLinks.forEach(link => {
        db.run(`
          INSERT INTO links (profile_id, title, url, type, position)
          VALUES (?, ?, ?, ?, ?)
        `, [demoId, link.title, link.url, link.type, link.position]);
      });

      console.log('Seeded demo profile: demo-shop');
    }
  });
});

export default db;
