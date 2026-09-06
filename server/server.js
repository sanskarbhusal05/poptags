import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to generate clean handle / ID
function generateSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'shop';
}

// -------------------------------------------------------------
// STEP 1: Save Profile & Contact Information into SQLite DB
// -------------------------------------------------------------
app.post('/api/profile', (req, res) => {
  const { owner_name, shop_name, contact_no, bio, profile_id } = req.body;

  if (!owner_name || !shop_name || !contact_no) {
    return res.status(400).json({ error: 'Owner name, shop name, and contact number are required' });
  }

  const id = profile_id || `${generateSlug(shop_name)}-${Math.floor(1000 + Math.random() * 9000)}`;

  db.get(`SELECT id FROM profiles WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      // Update existing profile
      db.run(
        `UPDATE profiles SET owner_name = ?, shop_name = ?, contact_no = ?, bio = ? WHERE id = ?`,
        [owner_name, shop_name, contact_no, bio || '', id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Profile updated successfully', profile_id: id });
        }
      );
    } else {
      // Insert new profile
      db.run(
        `INSERT INTO profiles (id, owner_name, shop_name, contact_no, bio) VALUES (?, ?, ?, ?, ?)`,
        [id, owner_name, shop_name, contact_no, bio || ''],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });

          // Add default WhatsApp link automatically for convenience
          const waUrl = `https://wa.me/${contact_no.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(shop_name)}!`;
          db.run(
            `INSERT INTO links (profile_id, title, url, type, position) VALUES (?, ?, ?, ?, ?)`,
            [id, 'Chat on WhatsApp', waUrl, 'whatsapp', 1]
          );

          res.json({ message: 'Profile created in database successfully', profile_id: id });
        }
      );
    }
  });
});

// -------------------------------------------------------------
// GET Profile & Links by ID
// -------------------------------------------------------------
app.get('/api/profile/:id', (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM profiles WHERE id = ?`, [id], (err, profile) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!profile) return res.status(404).json({ error: 'Shop profile not found' });

    db.all(`SELECT * FROM links WHERE profile_id = ? ORDER BY position ASC, id ASC`, [id], (err, links) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ profile, links });
    });
  });
});

// -------------------------------------------------------------
// STEP 2: Add Link Button
// -------------------------------------------------------------
app.post('/api/links', (req, res) => {
  const { profile_id, title, url, type } = req.body;

  if (!profile_id || !title || !url) {
    return res.status(400).json({ error: 'profile_id, title, and url are required' });
  }

  db.run(
    `INSERT INTO links (profile_id, title, url, type) VALUES (?, ?, ?, ?)`,
    [profile_id, title, url, type || 'link'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Link added successfully', link_id: this.lastID });
    }
  );
});

// Delete Link Button
app.delete('/api/links/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM links WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Link deleted successfully' });
  });
});

// Track Click Counter
app.post('/api/links/:id/click', (req, res) => {
  const { id } = req.params;
  db.run(`UPDATE links SET click_count = click_count + 1 WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Click recorded' });
  });
});

// -------------------------------------------------------------
// EXPORT ALL DATA TO EXCEL / CSV
// -------------------------------------------------------------
app.get('/api/export/csv', (req, res) => {
  const query = `
    SELECT 
      p.id AS profile_id,
      p.owner_name,
      p.shop_name,
      p.contact_no,
      p.bio,
      p.created_at,
      COUNT(l.id) AS total_links,
      COALESCE(SUM(l.click_count), 0) AS total_clicks,
      GROUP_CONCAT(l.title || ': ' || l.url, ' | ') AS all_links
    FROM profiles p
    LEFT JOIN links l ON p.id = l.profile_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // UTF-8 BOM so Excel opens it with correct formatting
    let csv = '\uFEFF';
    csv += 'Profile ID,Business / Shop Name,Owner Name,Contact Number,Bio,Total Links,Total Clicks,Links Details,Created Date\r\n';

    rows.forEach(r => {
      const escape = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
      csv += `${escape(r.profile_id)},${escape(r.shop_name)},${escape(r.owner_name)},${escape(r.contact_no)},${escape(r.bio)},${r.total_links},${r.total_clicks},${escape(r.all_links)},${escape(r.created_at)}\r\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="poptags_all_data.csv"');
    res.status(200).send(csv);
  });
});

// Serve compiled client production assets
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// SPA Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 PopTags Backend Server running on http://localhost:${PORT}`);
});
