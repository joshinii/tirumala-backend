const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(bodyParser.json());
app.use(cors());

const allowedOrigins = ['http://localhost:4200', 'https://tirumala-planners.onrender.com','https://www.tirumalaplanners.com/'];

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
    return res.status(400).send('All fields are required.');
  }

  try {
    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your email provider (e.g., Gmail, Outlook, etc.)
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_OWNER, // App owner's email
      subject: 'New Customer Inquiry - Tirumala Planners',
      text: `You have received a new customer request from the Tirumala Planners website. Please find the details below:
      \nName: ${name}
      \nEmail: ${email}
      \nPhone: ${phone}
      \nMessage: ${message}`,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).send('Form submitted and email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Failed to send email.');
  }
});

app.get('/api/assets/:file', (req, res) => {
  const filePath = path.resolve(__dirname, 'assets', req.params.file);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.log('__dirname: '+__dirname+'file name: '+req.params.file);
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
      console.log('directoryPath '+directoryPath)
      console.log('category '+category)
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
