import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import axios from 'axios';
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'grand_vizag_secret_2026';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'concierge@grandvizag.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'The Grand Vizag';

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

const ddbClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Razorpay Configuration
const RazorpayConstructor = (Razorpay as any).default || Razorpay;
const razorpay = new RazorpayConstructor({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Table Names
const USERS_TABLE = 'GrandVizag_Users';
const SEATS_TABLE = 'GrandVizag_Seats';
const OTPS_TABLE = 'GrandVizag_OTPs';
const MOVIE_TABLE = 'GrandVizag_Movie';

// Database Initialization
async function initDB() {
  const tables = [
    {
      TableName: USERS_TABLE,
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' as const }],
      AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' as const }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
      TableName: SEATS_TABLE,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' as const }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
      TableName: OTPS_TABLE,
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' as const }],
      AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' as const }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
      TableName: MOVIE_TABLE,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' as const }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    }
  ];

  for (const table of tables) {
    try {
      await ddbClient.send(new DescribeTableCommand({ TableName: table.TableName }));
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException') {
        console.log(`Creating table ${table.TableName}...`);
        await ddbClient.send(new CreateTableCommand(table));
        
        let isAvailable = false;
        while (!isAvailable) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const description = await ddbClient.send(new DescribeTableCommand({ TableName: table.TableName }));
            if (description.Table?.TableStatus === 'ACTIVE') isAvailable = true;
          } catch (e) {}
        }
      }
    }
  }

  // Seed Default Movie
  try {
    const movieData = await docClient.send(new GetCommand({ TableName: MOVIE_TABLE, Key: { id: 'current' } }));
    if (!movieData.Item) {
      await docClient.send(new PutCommand({
        TableName: MOVIE_TABLE,
        Item: {
          id: 'current',
          title: 'Oppenheimer',
          description: "Director's Cut • Private Screening",
          posterUrl: '',
          date: 'Oct 24, 2026',
          time: '20:00'
        }
      }));
    }
  } catch (err) {
    console.error('Error seeding movie:', err);
  }

  // Seed Seats
  try {
    const seatsData = await docClient.send(new ScanCommand({ TableName: SEATS_TABLE, Limit: 1 }));
    if (!seatsData.Items || seatsData.Items.length === 0) {
      console.log('Seeding seats...');
      const rows = ['A', 'B', 'C'];
      for (const row of rows) {
        for (let i = 1; i <= 10; i++) {
          await docClient.send(new PutCommand({
            TableName: SEATS_TABLE,
            Item: { id: `${row}${i}`, status: 'available' }
          }));
        }
      }
    }
  } catch (err) {
    console.error('Error seeding seats:', err);
  }
}

async function sendEmailOTP(email: string, otp: string) {
  try {
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email }],
      subject: 'Your Access Code for The Grand Vizag',
      htmlContent: `
        <div style="font-family: serif; padding: 40px; background-color: #131313; color: #e5e2e1; text-align: center; border: 1px solid #f2ca50;">
          <h1 style="color: #f2ca50; letter-spacing: 4px;">THE GRAND VIZAG</h1>
          <p style="font-size: 18px; font-style: italic;">Exclusive Cinematic Estate</p>
          <hr style="border: 0; border-top: 1px solid #4d4635; margin: 30px 0;">
          <p>Greetings,</p>
          <p>To verify join the estate, please use the following access code:</p>
          <div style="font-size: 32px; font-weight: bold; color: #f2ca50; margin: 30px 0; letter-spacing: 10px;">${otp}</div>
          <p style="font-size: 12px; color: #99907c;">This code will expire in 10 minutes.</p>
        </div>
      `
    }, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
  } catch (err: any) {
    if (err.response) {
      console.error('Brevo API Error Details:', JSON.stringify(err.response.data, null, 2));
      throw new Error(`Email service error: ${err.response.data.message || 'Check sender verification'}`);
    }
    console.error('Brevo Network Error:', err.message);
    throw new Error('Failed to reach email service');
  }
}

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// CORS — allow Vercel frontend and local dev
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://grandvizagtheatre.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(cookieParser());

// Database Initialization Flag
let isDbInitialized = false;

async function ensureDb() {
  if (isDbInitialized) return;
  await initDB();
  isDbInitialized = true;
}

// Middleware to ensure DB is initialized
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await ensureDb();
    } catch (err) {
      console.error('DB Init Error:', err);
    }
  }
  next();
});

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) {
      console.warn(`[Auth] No token found for ${req.method} ${req.path}. Cookies present:`, Object.keys(req.cookies));
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err: any) {
      console.error(`[Auth] Token verification failed for ${req.path}:`, err.message);
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // API Routes
  app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    
    if (!BREVO_API_KEY) {
      console.error('CRITICAL: BREVO_API_KEY is not defined in environment variables.');
      return res.status(500).json({ error: 'Mail service not configured. Please set BREVO_API_KEY in Vercel.' });
    }

    console.log(`[Email] Attempting to send OTP to ${email} using sender ${BREVO_SENDER_EMAIL}`);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    try {
      await docClient.send(new PutCommand({
        TableName: OTPS_TABLE,
        Item: { email, otp, expiry }
      }));
      await sendEmailOTP(email, otp);
      res.json({ message: 'OTP sent successfully' });
    } catch (err: any) {
      console.error(`[Email] Failed to send to ${email}:`, err.message);
      res.status(500).json({ error: err.message || 'Failed to send access code' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, otp } = req.body;
    try {
      // Verify OTP
      const { Item: otpData } = await docClient.send(new GetCommand({
        TableName: OTPS_TABLE,
        Key: { email }
      }));

      const isAdminBypass = otp === (process.env.ADMIN_KEY || 'lumiere-admin-2024');

      if (!isAdminBypass) {
        if (!otpData || otpData.otp !== otp || Date.now() > otpData.expiry) {
          return res.status(400).json({ error: 'Invalid or expired access code' });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: { email, password: hashedPassword, name, createdAt: new Date().toISOString() },
        ConditionExpression: 'attribute_not_exists(email)'
      }));

      // Cleanup OTP
      await docClient.send(new DeleteCommand({ TableName: OTPS_TABLE, Key: { email } }));

      // Auto login after register
      const token = jwt.sign({ email, name }, JWT_SECRET, { expiresIn: '24h' });
      res.cookie('token', token, { 
        httpOnly: true, 
        sameSite: 'none', 
        path: '/',
        secure: true 
      });
      res.json({ email, name });
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
      }
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const { Item: user } = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { email }
      }));

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
      res.cookie('token', token, { 
        httpOnly: true, 
        sameSite: 'none', 
        path: '/',
        secure: true
      });
      res.json({ email: user.email, name: user.name });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', { sameSite: 'none', secure: true, path: '/' });
    res.json({ message: 'Logged out' });
  });

  // Forgot Password
  app.post('/api/auth/reset-password-request', async (req, res) => {
    const { email } = req.body;
    try {
      const { Item: user } = await docClient.send(new GetCommand({ TableName: USERS_TABLE, Key: { email } }));
      if (!user) {
        // We return success even if user not found for security, but we only send OTP if user exists
        return res.json({ message: 'If an account exists, an access code has been sent.' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 10 * 60 * 1000;
      
      await docClient.send(new PutCommand({
        TableName: OTPS_TABLE,
        Item: { email, otp, expiry, type: 'reset' }
      }));

      await sendEmailOTP(email, otp);
      res.json({ message: 'If an account exists, an access code has been sent.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to process request' });
    }
  });

  app.post('/api/auth/reset-password-verify', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
      const { Item: otpData } = await docClient.send(new GetCommand({ TableName: OTPS_TABLE, Key: { email } }));
      if (!otpData || otpData.otp !== otp || Date.now() > otpData.expiry) {
        return res.status(400).json({ error: 'Invalid or expired access code' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { email },
        UpdateExpression: 'SET password = :p',
        ExpressionAttributeValues: { ':p': hashedPassword }
      }));

      await docClient.send(new DeleteCommand({ TableName: OTPS_TABLE, Key: { email } }));
      res.json({ message: 'Password has been elegantly reset. You may now login.' });
    } catch (err) {
      res.status(500).json({ error: 'Reset failed' });
    }
  });

  // User Bookings
  app.get('/api/user/bookings', authenticate, async (req: any, res) => {
    try {
      const data = await docClient.send(new ScanCommand({
        TableName: SEATS_TABLE,
        FilterExpression: 'userEmail = :email',
        ExpressionAttributeValues: { ':email': req.user.email }
      }));
      res.json(data.Items || []);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch your reservations' });
    }
  });

  // Movie Management
  app.get('/api/movie', async (req, res) => {
    try {
      const { Item } = await docClient.send(new GetCommand({ TableName: MOVIE_TABLE, Key: { id: 'current' } }));
      res.json(Item || {}); // Always return an object, even if empty
    } catch (err) {
      console.error('Movie fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch movie details' });
    }
  });

  app.post('/api/admin/movie', authenticate, async (req: any, res) => {
    const { title, description, posterUrl, date, time } = req.body;
    
    // Check for admin permission (you could use a specific admin flag, 
    // for now we'll allow access if the profile name matches or via a simple check)
    // In a real app, users would have 'role: admin'
    if (req.user.email !== 'dattaeswar.tangeti@gmail.com') {
       return res.status(403).json({ error: 'Access Denied: You are not authorized to enter the Admin Manor' });
    }

    try {
      console.log(`[Admin] Updating estate movie data by: ${req.user.email}`);
      await docClient.send(new PutCommand({
        TableName: MOVIE_TABLE,
        Item: { id: 'current', title, description, posterUrl, date, time }
      }));
      console.log('[Admin] Estate updated successfully');
      res.json({ message: 'The Estate has been updated' });
    } catch (err: any) {
      console.error('[Admin] Movie update error:', err.message);
      if (err.name === 'ValidationException' && posterUrl?.length > 300000) {
        return res.status(400).json({ error: 'Poster image is too large for the archives (Max ~300KB)' });
      }
      res.status(500).json({ error: 'Record update failed' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json(null);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json(decoded);
    } catch (err) {
      res.json(null);
    }
  });

  app.get('/api/seats', async (req, res) => {
    try {
      const data = await docClient.send(new ScanCommand({ TableName: SEATS_TABLE }));
      const items = (data.Items || []).sort((a: any, b: any) => a.id.localeCompare(b.id));
      res.json(items);
    } catch (err) {
      console.error('Fetch seats error:', err);
      res.json([]); // Return empty array instead of error object to prevent frontend crash
    }
  });

  app.post('/api/payments/create-order', authenticate, async (req: any, res) => {
    const { amount } = req.body;
    if (!amount) {
      console.error('Payment Error: Amount missing in request');
      return res.status(400).json({ error: 'Amount is required' });
    }

    try {
      console.log(`[Razorpay] Creating order: Amount=${amount} INR`);
      const order = await razorpay.orders.create({
        amount: Math.round(Number(amount) * 100), // Amount in paise
        currency: 'INR',
        receipt: `vizag_rec_${Date.now()}`,
      });
      console.log('[Razorpay] Order created successfully:', order.id);
      res.json(order);
    } catch (err: any) {
      console.error('[Razorpay] Order Creation Failed:', JSON.stringify(err));
      res.status(500).json({ 
        error: err.description || err.message || 'Razorpay order failed',
        details: err
      });
    }
  });

  app.post('/api/seats/book', authenticate, async (req: any, res) => {
    const { seatIds } = req.body;
    const userEmail = req.user.email;

    try {
      for (const id of seatIds) {
        await docClient.send(new UpdateCommand({
          TableName: SEATS_TABLE,
          Key: { id },
          UpdateExpression: 'SET #status = :booked, #user = :user, #time = :time',
          ConditionExpression: '#status = :available',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#user': 'userEmail',
            '#time': 'bookedAt'
          },
          ExpressionAttributeValues: {
            ':booked': 'booked',
            ':available': 'available',
            ':user': userEmail,
            ':time': new Date().toISOString()
          }
        }));
      }
      res.json({ message: 'Seats booked successfully' });
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        res.status(400).json({ error: 'One or more seats are no longer available' });
      } else {
        res.status(500).json({ error: 'Booking failed' });
      }
    }
  });

  // Admin Seat Blocking (No Payment)
  app.post('/api/admin/seats/block', authenticate, async (req: any, res) => {
    if (req.user.email !== 'dattaeswar.tangeti@gmail.com') {
      return res.status(403).json({ error: 'Access Denied' });
    }

    const { seatIds } = req.body;
    const userEmail = req.user.email;

    try {
      console.log(`[Admin] Blocking seats: ${seatIds.join(', ')} by ${userEmail}`);
      for (const id of seatIds) {
        await docClient.send(new UpdateCommand({
          TableName: SEATS_TABLE,
          Key: { id },
          UpdateExpression: 'SET #status = :booked, #user = :user, #time = :time, #type = :type',
          ConditionExpression: '#status = :available',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#user': 'userEmail',
            '#time': 'bookedAt',
            '#type': 'bookingType'
          },
          ExpressionAttributeValues: {
            ':booked': 'booked',
            ':available': 'available',
            ':user': userEmail,
            ':time': new Date().toISOString(),
            ':type': 'admin_block'
          }
        }));
      }
      res.json({ message: 'Seats blocked successfully' });
    } catch (err: any) {
      console.error('[Admin] Block error:', err.message);
      if (err.name === 'ConditionalCheckFailedException') {
        res.status(400).json({ error: 'One or more seats are no longer available' });
      } else {
        res.status(500).json({ error: 'Blocking failed' });
      }
    }
  });

  // Admin Seat Unblocking
  app.post('/api/admin/seats/unblock', authenticate, async (req: any, res) => {
    if (req.user.email !== 'dattaeswar.tangeti@gmail.com') {
      return res.status(403).json({ error: 'Access Denied' });
    }

    const { seatIds } = req.body;

    try {
      console.log(`[Admin] Unblocking seats: ${seatIds.join(', ')}`);
      for (const id of seatIds) {
        await docClient.send(new UpdateCommand({
          TableName: SEATS_TABLE,
          Key: { id },
          UpdateExpression: 'REMOVE userEmail, bookedAt, paymentId, orderId, bookingType SET #status = :available',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':available': 'available'
          }
        }));
      }
      res.json({ message: 'Seats unblocked successfully' });
    } catch (err: any) {
      console.error('[Admin] Unblock error:', err.message);
      res.status(500).json({ error: 'Unblocking failed' });
    }
  });

async function finishSetup() {
  await initDB();
  
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

finishSetup();
export default app;
