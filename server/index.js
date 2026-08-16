const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const dbPath = path.join(__dirname, 'data', 'campusfix.db');
const uploadDir = path.join(__dirname, 'uploads');

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(uploadDir));

if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    return;
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Reported',
      imagePath TEXT,
      createdAt TEXT NOT NULL
    )
  `, (createErr) => {
    if (createErr) {
      console.error('Error creating issues table:', createErr.message);
      return;
    }

    seedDemoData();
  });
});

const statusOptions = ['Reported', 'Assigned', 'In Progress', 'Resolved'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const categories = ['Lighting', 'Facilities', 'Water', 'Safety', 'Equipment', 'Cleanliness', 'Technology'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function getBaseUrl(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
  const host = forwardedHost ? forwardedHost.split(',')[0].trim() : req.get('host');
  return `${protocol}://${host}`;
}

function seedDemoData() {
  db.get('SELECT COUNT(*) AS count FROM issues', (err, row) => {
    if (err) {
      console.error('Failed to count issues:', err.message);
      return;
    }

    if (row.count > 0) {
      return;
    }

    const sampleIssues = [
      {
        id: 'ISS-1001',
        title: 'Broken hallway light',
        description: 'The light in the east hallway near the engineering block has been flickering for two days.',
        category: 'Lighting',
        location: 'Engineering Block, Floor 2',
        priority: 'High',
        status: 'Assigned',
        imagePath: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ISS-1002',
        title: 'Water leak near labs',
        description: 'There is a leak creating a puddle near the chemistry lab entrance.',
        category: 'Water',
        location: 'Science Building, Entrance',
        priority: 'Urgent',
        status: 'In Progress',
        imagePath: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
      {
        id: 'ISS-1003',
        title: 'Dirty study lounge',
        description: 'The main study lounge is not being cleaned regularly and needs attention.',
        category: 'Cleanliness',
        location: 'Library, First Floor',
        priority: 'Medium',
        status: 'Reported',
        imagePath: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      },
      {
        id: 'ISS-1004',
        title: 'Projector not working',
        description: 'The projector in room 204 has a blank screen and no response from the remote.',
        category: 'Technology',
        location: 'Room 204, Academic Hall',
        priority: 'High',
        status: 'Resolved',
        imagePath: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ];

    const insertSql = `INSERT INTO issues (id, title, description, category, location, priority, status, imagePath, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    sampleIssues.forEach((issue) => {
      db.run(insertSql, [issue.id, issue.title, issue.description, issue.category, issue.location, issue.priority, issue.status, issue.imagePath, issue.createdAt]);
    });
  });
}

function getIssueId() {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM issues ORDER BY rowid DESC LIMIT 1', (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (!row) {
        resolve('ISS-1001');
        return;
      }

      const lastNumber = Number.parseInt(row.id.split('-')[1], 10) || 1000;
      resolve(`ISS-${lastNumber + 1}`);
    });
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'CampusFix API is running' });
});

app.get('/api/issues', (req, res) => {
  const { category, priority, status } = req.query;
  let sql = 'SELECT * FROM issues';
  const params = [];

  if (category || priority || status) {
    const clauses = [];

    if (category) {
      clauses.push('category = ?');
      params.push(category);
    }

    if (priority) {
      clauses.push('priority = ?');
      params.push(priority);
    }

    if (status) {
      clauses.push('status = ?');
      params.push(status);
    }

    sql += ` WHERE ${clauses.join(' AND ')}`;
  }

  sql += ' ORDER BY createdAt DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const normalizedRows = rows.map((issue) => ({
      ...issue,
      imageUrl: issue.imagePath ? `${getBaseUrl(req)}/uploads/${path.basename(issue.imagePath)}` : null,
    }));

    res.json(normalizedRows);
  });
});

app.post('/api/issues', upload.single('image'), async (req, res) => {
  const { title, description, category, location, priority } = req.body;

  if (!title || !description || !category || !location || !priority) {
    res.status(400).json({ error: 'Please complete all required fields.' });
    return;
  }

  if (!categories.includes(category)) {
    res.status(400).json({ error: 'Invalid category selected.' });
    return;
  }

  if (!priorities.includes(priority)) {
    res.status(400).json({ error: 'Invalid priority selected.' });
    return;
  }

  try {
    const issueId = await getIssueId();
    const imagePath = req.file ? req.file.path : null;
    const issue = {
      id: issueId,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      priority,
      status: 'Reported',
      imagePath,
      createdAt: new Date().toISOString(),
    };

    db.run(
      'INSERT INTO issues (id, title, description, category, location, priority, status, imagePath, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [issue.id, issue.title, issue.description, issue.category, issue.location, issue.priority, issue.status, issue.imagePath, issue.createdAt],
      (insertErr) => {
        if (insertErr) {
          res.status(500).json({ error: insertErr.message });
          return;
        }

        res.status(201).json({
          ...issue,
          imageUrl: issue.imagePath ? `${getBaseUrl(req)}/uploads/${path.basename(issue.imagePath)}` : null,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Unable to create issue.' });
  }
});

app.patch('/api/issues/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!statusOptions.includes(status)) {
    res.status(400).json({ error: 'Invalid status.' });
    return;
  }

  db.run('UPDATE issues SET status = ? WHERE id = ?', [status, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Issue not found.' });
      return;
    }

    db.get('SELECT * FROM issues WHERE id = ?', [id], (fetchErr, updatedIssue) => {
      if (fetchErr) {
        res.status(500).json({ error: fetchErr.message });
        return;
      }

      res.json({
        ...updatedIssue,
        imageUrl: updatedIssue.imagePath ? `${getBaseUrl(req)}/uploads/${path.basename(updatedIssue.imagePath)}` : null,
      });
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CampusFix server running on http://localhost:${PORT}`);
});
