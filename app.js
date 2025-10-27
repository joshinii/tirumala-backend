const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_OWNER'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please create a .env file with EMAIL_USER, EMAIL_PASS, and EMAIL_OWNER');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(bodyParser.json());

const allowedOrigins = [
  'http://localhost:4200',
  'https://tirumala-planners.onrender.com',
  'https://www.tirumalaplanners.com',
  'https://v0-tirumala-planners-k6aoirwdboc.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.get('/', (req, res) => {
  res.send('Hello from your Node.js server!');
});

//to access assets
app.use('/api/assets', cors(), express.static(path.join(__dirname, 'assets')));


// Database setup
const db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// db.run(`DROP TABLE contacts`);
// Create Contacts table with phone number column
db.run(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL
  )
`);

// API endpoint to save contact details and send an email
app.post('/api/send-quote', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ text: 'All fields are required.' });
  }

  try {
    // Insert contact into database first
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)`,
        [name, email, phone, message],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_OWNER,
      subject: 'New Customer Inquiry - Tirumala Planners',
      text: `You have received a new customer request from the Tirumala Planners website. Please find the details below:
      \nName: ${name}
      \nEmail: ${email}
      \nPhone: ${phone}
      \nMessage: ${message}`,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ text: 'Form submitted and email sent successfully.' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ text: 'Failed to send email.' });
  }
});

app.get('/api/assets/:file', (req, res) => {
  const filePath = path.resolve(__dirname, 'assets', req.params.file);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.log('__dirname: ' + __dirname + 'file name: ' + req.params.file);
    return res.status(404).send('File not found');
  }

  // Dynamically set Content-Type based on file extension
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream'; // Default to binary stream
  res.setHeader('Content-Type', contentType);

  // Inline content disposition
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Serve the file
  res.sendFile(filePath);
});


app.get('/api/files', (req, res) => {
  try {
    const category = req.query.category; // Accept category as a query parameter

    const directoryPath = path.join(__dirname, 'assets');
    const allFiles = fs.readdirSync(directoryPath);

    const filteredFiles = allFiles.filter((file) => {
      // Filter files based on category
      if (category === 'elevation') return file.startsWith('elevation_');
      if (category === 'plan') return file.startsWith('plan_');
      return true; // Default: return all files
    });
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.json(filteredFiles);
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});


//Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
  console.log(`dir name: ${__dirname}`);
});
