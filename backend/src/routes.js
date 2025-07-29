const express = require('express');
const { db } = require('./database');
const bcrypt = require('bcrypt');

const router = express.Router();

// User login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result) {
        res.json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  });
});

// Admin login
router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND role = "admin"', [username], (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (result) {
          res.json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      });
    });
  });

// Get all candidates
router.get('/candidates', (req, res) => {
    db.all('SELECT * FROM candidates', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Cast a vote
router.post('/vote', (req, res) => {
    const { userId, candidateId } = req.body;

    // Check if user has already voted
    db.get('SELECT has_voted FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user.has_voted) {
            return res.status(403).json({ error: 'You have already voted.' });
        }

        // Insert the vote
        db.run('INSERT INTO votes (user_id, candidate_id) VALUES (?, ?)', [userId, candidateId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Mark user as voted
            db.run('UPDATE users SET has_voted = 1 WHERE id = ?', [userId], (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Vote cast successfully' });
            });
        });
    });
});

// Get live results
router.get('/results', (req, res) => {
    const query = `
        SELECT c.name, c.position, COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON c.id = v.candidate_id
        GROUP BY c.id
        ORDER BY vote_count DESC;
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Admin: Add a user
router.post('/admin/users', (req, res) => {
    const { username, password, role } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'User added successfully', userId: this.lastID });
        });
    });
});

// Admin: Get all users
router.get('/admin/users', (req, res) => {
    db.all('SELECT id, username, role, has_voted FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Admin: Remove a user
router.delete('/admin/users/:id', (req, res) => {
    const userId = req.params.id;
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'User removed successfully' });
    });
});

module.exports = router;
