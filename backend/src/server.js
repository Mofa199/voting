const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { db, setupDatabase } = require('./database');
const routes = require('./routes');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/images', express.static(path.join(__dirname, '../../public/uploads')));


// Setup database
setupDatabase();

// Routes
app.use('/api', routes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/login.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
