// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
// const fileRoutes = require('./routes/fileRoutes'); // <--- Add this
// const shareRoutes = require('./routes/shareRoutes'); // <--- Add this

connectDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
// app.use('/api/files', fileRoutes); // <--- Use file routes
// app.use('/api/share', shareRoutes); // <--- Use share routes


// Create uploads directory if it doesn't exist (moved to fileRoutes for multer init)
// const fs = require('fs');
// const uploadsDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadsDir)){
//     fs.mkdirSync(uploadsDir);
// }

app.use((err, req, res, next) => {
  console.error(err.stack);
  // If error is from multer (e.g. file too large)
  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({ message: err.message, code: err.code });
  }
  res.status(500).send({ message: 'Something broke!', error: err.message });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});