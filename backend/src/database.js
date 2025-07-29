const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database(':memory:');

const saltRounds = 10;

const setupDatabase = () => {
  db.serialize(() => {
    // Create users table
    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT CHECK(role IN ('admin', 'voter')) NOT NULL,
      has_voted INTEGER DEFAULT 0
    )`);

    // Create candidates table
    db.run(`CREATE TABLE candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      bio TEXT,
      image_url TEXT
    )`);

    // Create votes table
    db.run(`CREATE TABLE votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      candidate_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(candidate_id) REFERENCES candidates(id)
    )`);

    // Create dummy admin user
    bcrypt.hash('admin123', saltRounds, (err, hash) => {
      if (err) {
        return console.error(err.message);
      }
      db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
    });

    // Create dummy voter user
    bcrypt.hash('voter123', saltRounds, (err, hash) => {
        if (err) {
            return console.error(err.message);
        }
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['voter1', hash, 'voter']);
    });

    // Create dummy candidates
    db.run("INSERT INTO candidates (name, position, bio, image_url) VALUES (?, ?, ?, ?)", ['Candidate A', 'President', 'Bio of Candidate A', 'images/candidateA.jpg']);
    db.run("INSERT INTO candidates (name, position, bio, image_url) VALUES (?, ?, ?, ?)", ['Candidate B', 'President', 'Bio of Candidate B', 'images/candidateB.jpg']);
  });
};

module.exports = {
  db,
  setupDatabase,
};
