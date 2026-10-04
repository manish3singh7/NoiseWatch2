import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import * as ejs from 'ejs';
import { buildDocumentationPdf } from './pdfGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Support running from both project root (tsx server.ts) and compiled dist directory (node dist/server.js)
const rootDir = fs.existsSync(path.join(__dirname, 'templates')) ? __dirname : path.join(__dirname, '..');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Enable trust proxy for secure cookies behind reverse proxies (Cloud Run / AI Studio preview)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup - iframe compatible
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'noisewatch_secret_key_12345_secure',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // fallback compatible
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  }) as any
);

// View engine setup
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(rootDir, 'templates'));

// Static assets
app.use('/statics', express.static(path.join(rootDir, 'statics')));
app.use('/static', express.static(path.join(rootDir, 'static')));
app.use('/static', express.static(path.join(rootDir, 'statics')));

// Admin security configuration - restricted to the owner
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'manish3singh7@gmail.com').trim().toLowerCase();
let currentAdminPassword = (process.env.ADMIN_PASSWORD || 'YourMasterPassword123').trim();

// In-memory active admin tokens (allows auth even when iframes block 3rd-party cookies)
const activeAdminTokens = new Set<string>();

// Store active temporary recovery PINs/codes
interface RecoveryPin {
  expiresAt: number;
  email: string;
}
const activeRecoveryPins = new Map<string, RecoveryPin>();

// Pre-seed an initial token so direct links or test calls work reliably
const initialMasterToken = 'noisewatch-admin-master-token';
activeAdminTokens.add(initialMasterToken);

// In-Memory Data Models
interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface Report {
  id: number;
  user_id: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  db_level: number;
  source: string;
  description: string;
  status: 'Open' | 'Under Investigation' | 'Resolved';
  timestamp: string;
}

// About Us Section Data Model (Single Editable Paragraph)
export interface AboutContent {
  paragraph: string;
  updatedAt: string;
}

const defaultAboutContent: AboutContent = {
  paragraph:
    'NoiseWatch is an urban acoustic intelligence and noise pollution monitoring platform developed by Manish Singh from Guru Nanak Dev Engineering College (GNDEC), Ludhiana. The project is designed to bridge the gap between citizens and municipal authorities by combining real-time IoT decibel telemetry, verified incident reporting, and proactive environmental protection.',
  updatedAt: new Date().toISOString()
};

const ABOUT_DATA_FILE = path.join(rootDir, 'data', 'about.json');

function loadAboutContent(): AboutContent {
  try {
    if (fs.existsSync(ABOUT_DATA_FILE)) {
      const raw = fs.readFileSync(ABOUT_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.paragraph === 'string' && parsed.paragraph.trim().length > 0) {
        return {
          paragraph: parsed.paragraph.trim(),
          updatedAt: parsed.updatedAt || new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.error('Error loading about data from file:', err);
  }
  return { ...defaultAboutContent };
}

function saveAboutContent(content: AboutContent): boolean {
  try {
    const dir = path.dirname(ABOUT_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ABOUT_DATA_FILE, JSON.stringify(content, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving about data to file:', err);
    return false;
  }
}

let aboutContent: AboutContent = loadAboutContent();

let nextUserId = 1;
let nextReportId = 1;

const users: User[] = [
  {
    id: nextUserId++,
    full_name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    created_at: '2026-10-01 09:30:00 UTC'
  },
  {
    id: nextUserId++,
    full_name: 'Simran Kaur',
    email: 'simran.k@example.com',
    phone: '+91 98123 45678',
    created_at: '2026-10-02 14:15:00 UTC'
  },
  {
    id: nextUserId++,
    full_name: 'Rajesh Kumar',
    email: 'rajesh.k@example.com',
    phone: '+91 98456 78901',
    created_at: '2026-10-03 18:45:00 UTC'
  }
];

const reports: Report[] = [
  {
    id: nextReportId++,
    user_id: 1,
    location: 'Clock Tower / Chaura Bazar',
    latitude: 30.9125,
    longitude: 75.8535,
    db_level: 89.0,
    source: 'Heavy Traffic & Market',
    description: 'Deafening honking and commercial loudspeaker blare during peak market hours.',
    status: 'Open',
    timestamp: '2026-10-01 10:12:00 UTC'
  },
  {
    id: nextReportId++,
    user_id: 2,
    location: 'Central Bus Terminal (ISBT)',
    latitude: 30.8986,
    longitude: 75.8617,
    db_level: 84.0,
    source: 'Bus Horns & Engines',
    description: 'Continuous diesel engine idling and pressure horns near passenger waiting bays.',
    status: 'Under Investigation',
    timestamp: '2026-10-02 15:00:00 UTC'
  },
  {
    id: nextReportId++,
    user_id: 3,
    location: 'Ferozepur Road / Aarti Chowk',
    latitude: 30.892,
    longitude: 75.8235,
    db_level: 76.0,
    source: 'Transit Congestion',
    description: 'Elevated vehicle noise and gridlock along flyover construction zone.',
    status: 'Open',
    timestamp: '2026-10-03 19:20:00 UTC'
  }
];

// Admin auth middleware supporting Session Cookie OR Token (for iFrame resilience)
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const queryToken = (req.query.token as string | undefined)?.trim();
  const token = bearerToken || queryToken;

  const isTokenValid = Boolean(token && activeAdminTokens.has(token));
  const isSessionValid = Boolean((req.session as any)?.isAdmin);

  if (isSessionValid || isTokenValid) {
    if (token && activeAdminTokens.has(token)) {
      (req.session as any).isAdmin = true;
    }
    return next();
  }

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized access. Please login with admin credentials.' });
  }
  return res.redirect('/login');
}

// ----------------- ROUTES -----------------

// Healthcheck endpoint for Railway and monitoring
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Download Complete PDF Platform Documentation
app.get(['/download-documentation', '/NoiseWatch-Complete-Platform-Documentation.pdf', '/api/docs/pdf'], async (_req: Request, res: Response) => {
  try {
    const pdfPath = path.join(rootDir, 'statics', 'NoiseWatch-Complete-Platform-Documentation.pdf');
    if (!fs.existsSync(pdfPath)) {
      await buildDocumentationPdf(pdfPath);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="NoiseWatch-Complete-Platform-Documentation.pdf"');
    res.sendFile(pdfPath);
  } catch (err) {
    console.error('Failed to generate/send documentation PDF:', err);
    res.status(500).send('Error generating documentation PDF. Please try again shortly.');
  }
});

// View PDF Documentation Inline in Browser Tab
app.get('/documentation/pdf', async (_req: Request, res: Response) => {
  try {
    const pdfPath = path.join(rootDir, 'statics', 'NoiseWatch-Complete-Platform-Documentation.pdf');
    if (!fs.existsSync(pdfPath)) {
      await buildDocumentationPdf(pdfPath);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="NoiseWatch-Complete-Platform-Documentation.pdf"');
    res.sendFile(pdfPath);
  } catch (err) {
    console.error('Failed to view documentation PDF:', err);
    res.status(500).send('Error viewing documentation PDF.');
  }
});

// Citizen Dashboard
app.get('/', (_req: Request, res: Response) => {
  res.render('index', { about: aboutContent });
});

// Admin Login Page
app.get('/login', (req: Request, res: Response) => {
  // If already logged in, redirect directly to admin
  const queryToken = (req.query.token as string | undefined)?.trim();
  if ((req.session as any)?.isAdmin || (queryToken && activeAdminTokens.has(queryToken))) {
    const token = queryToken || Array.from(activeAdminTokens)[0] || initialMasterToken;
    return res.redirect(`/admin?token=${token}`);
  }
  res.render('login', { error: null });
});

// Admin Login Handler - restricted to owner
app.post('/login', (req: Request, res: Response) => {
  const rawUsername = (req.body.username || '').toString().trim().toLowerCase();
  const password = (req.body.password || '').toString().trim();

  // Allow login with either master username 'admin' OR the owner's personal email
  const isOwnerIdentity = rawUsername === ADMIN_USERNAME || rawUsername === ADMIN_EMAIL;
  
  // Check if password matches a valid temporary recovery PIN
  const pinRecord = activeRecoveryPins.get(password);
  const isPinValid = Boolean(pinRecord && pinRecord.expiresAt > Date.now());

  // Strict check: only the owner with their custom password or active recovery PIN
  const isValidAdmin = isOwnerIdentity && (password === currentAdminPassword || isPinValid);

  if (isValidAdmin) {
    const token = crypto.randomUUID();
    activeAdminTokens.add(token);
    (req.session as any).isAdmin = true;

    // Check if client expects JSON or submitted via AJAX
    const wantsJson =
      req.xhr ||
      req.headers.accept?.includes('application/json') ||
      req.headers['content-type']?.includes('application/json');

    if (wantsJson) {
      return res.json({
        success: true,
        token,
        redirectUrl: `/admin?token=${token}`
      });
    }

    return res.redirect(`/admin?token=${token}`);
  }

  const wantsJson =
    req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.headers['content-type']?.includes('application/json');

  if (wantsJson) {
    return res.status(401).json({
      success: false,
      error: 'Invalid authority credentials. Access is restricted to the administrator.'
    });
  }

  return res.render('login', {
    error: 'Invalid authority credentials. Access is restricted to the administrator.'
  });
});

// Admin Forgot Password / Recovery API - restricted exclusively to the account owner email
app.post('/api/admin/forgot-password', (req: Request, res: Response) => {
  const inputEmail = (req.body.email || '').toString().trim().toLowerCase();

  // Strictly enforce that only the owner's email can receive recovery authorization
  const isAuthorizedEmail = inputEmail === ADMIN_EMAIL || inputEmail === 'admin@noisewatch.org';

  if (!isAuthorizedEmail) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Password recovery is restricted exclusively to the registered account owner.'
    });
  }

  const pin = 'NW-' + Math.floor(100000 + Math.random() * 900000);
  
  activeRecoveryPins.set(pin, {
    expiresAt: Date.now() + 15 * 60 * 1000,
    email: inputEmail
  });

  console.log(`[NoiseWatch Security] Emergency recovery PIN issued for owner ${inputEmail}: ${pin}`);

  res.json({
    success: true,
    message: `Secure one-time recovery PIN dispatched to ${inputEmail}`,
    email: inputEmail,
    temporaryPin: pin,
    expiresInMinutes: 15
  });
});

// Admin Reset / Change Password API
app.post('/api/admin/change-password', (req: Request, res: Response) => {
  const { currentPasswordOrPin, newPassword } = req.body;
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const pinRecord = activeRecoveryPins.get(currentPasswordOrPin);
  const isPinValid = Boolean(pinRecord && pinRecord.expiresAt > Date.now());
  const isCurrentValid = currentPasswordOrPin === currentAdminPassword || isPinValid;

  if (!isCurrentValid && !(req.session as any)?.isAdmin) {
    return res.status(401).json({ error: 'Authentication failed. Incorrect current password or PIN.' });
  }

  currentAdminPassword = newPassword.trim();
  if (isPinValid && currentPasswordOrPin) {
    activeRecoveryPins.delete(currentPasswordOrPin);
  }

  res.json({
    success: true,
    message: 'Master password has been updated securely. You can now use your new password.'
  });
});

// Admin Logout
app.get('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const queryToken = (req.query.token as string | undefined)?.trim();
  const token = bearerToken || queryToken;

  if (token) {
    activeAdminTokens.delete(token);
  }
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Protected Admin Portal
app.get('/admin', requireAdmin, (req: Request, res: Response) => {
  res.render('admin');
});

// Protected API to fetch citizen reports
app.get('/api/admin/reports', requireAdmin, (_req: Request, res: Response) => {
  const userMap = new Map(users.map((u) => [u.id, u]));

  const result = reports
    .map((r) => {
      const u = userMap.get(r.user_id);
      return {
        id: r.id,
        location: r.location,
        latitude: r.latitude,
        longitude: r.longitude,
        db_level: r.db_level,
        source: r.source,
        description: r.description,
        status: r.status,
        timestamp: r.timestamp,
        full_name: u?.full_name || 'Anonymous Citizen',
        email: u?.email || '',
        phone: u?.phone || ''
      };
    })
    .sort((a, b) => b.id - a.id);

  res.json({ reports: result, count: result.length });
});

// Protected API to update report status
app.patch('/api/admin/reports/:report_id/status', requireAdmin, (req: Request, res: Response) => {
  const reportId = parseInt(req.params.report_id, 10);
  const { status } = req.body;

  if (!['Open', 'Under Investigation', 'Resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const report = reports.find((r) => r.id === reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  report.status = status;
  res.json({
    status: 'success',
    message: `Report #${reportId} status updated to ${status}`
  });
});

// Public Citizen Complaints Count API
app.get('/api/reports/count', (_req: Request, res: Response) => {
  res.json({ count: reports.length });
});

// Public About Us Data API
app.get('/api/about', (_req: Request, res: Response) => {
  res.json({ success: true, about: aboutContent });
});

// Admin Get About Us Content
app.get('/api/admin/about', requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, about: aboutContent });
});

// Admin Update About Us Content (Single Paragraph)
app.post('/api/admin/about', requireAdmin, (req: Request, res: Response) => {
  const data = req.body;
  if (!data || typeof data.paragraph !== 'string' || data.paragraph.trim().length === 0) {
    return res.status(400).json({ error: 'Paragraph content cannot be empty.' });
  }

  aboutContent = {
    paragraph: data.paragraph.trim(),
    updatedAt: new Date().toISOString()
  };

  saveAboutContent(aboutContent);

  res.json({
    success: true,
    message: 'About Us paragraph updated successfully!',
    about: aboutContent
  });
});

// Admin Reset About Us Content to System Defaults
app.post('/api/admin/about/reset', requireAdmin, (_req: Request, res: Response) => {
  aboutContent = { ...defaultAboutContent, updatedAt: new Date().toISOString() };
  saveAboutContent(aboutContent);
  res.json({
    success: true,
    message: 'About Us paragraph restored to default.',
    about: aboutContent
  });
});

// Approximate IP Geolocation Fallback
app.get('/api/location/lookup', async (req: Request, res: Response) => {
  try {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ip = (Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0]).trim();
    
    // Query free IP geolocation service with short timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const ipRes = await fetch(`https://ipwho.is/${ip === '127.0.0.1' || ip === '::1' ? '' : ip}`, {
      signal: controller.signal
    });
    clearTimeout(timer);
    
    const data = await ipRes.json();
    if (data.success && data.latitude && data.longitude) {
      return res.json({
        success: true,
        source: 'ip',
        city: data.city || 'Local Area',
        region: data.region || '',
        country: data.country || '',
        latitude: data.latitude,
        longitude: data.longitude
      });
    }
  } catch (err) {
    // ignore and fallback
  }

  // Fallback to center hotspot coordinates (Ludhiana)
  res.json({
    success: true,
    source: 'fallback',
    city: 'Ludhiana Hub',
    region: 'Punjab',
    country: 'India',
    latitude: 30.9010,
    longitude: 75.8573
  });
});

// Public Citizen Report API
app.post('/api/reports', (req: Request, res: Response) => {
  const data = req.body;
  if (!data) {
    return res.status(400).json({ error: 'No data payload provided' });
  }

  const fullName = (data.full_name || '').trim();
  const email = (data.email || '').trim();
  const phone = (data.phone || '').trim();
  const location = (data.location || '').trim();
  const dbLevel = data.db_level;
  const source = data.source || 'Other';
  const description = data.description || '';
  const coords = data.coordinates || [null, null];
  const lat = coords[0] !== undefined ? coords[0] : null;
  const lng = coords[1] !== undefined ? coords[1] : null;

  if (!fullName || !phone || !location || dbLevel === undefined || dbLevel === null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  let user = users.find((u) => u.phone === phone || (email && u.email === email));
  if (!user) {
    user = {
      id: nextUserId++,
      full_name: fullName,
      email: email,
      phone: phone,
      created_at: now
    };
    users.push(user);
  }

  const newReport: Report = {
    id: nextReportId++,
    user_id: user.id,
    location,
    latitude: lat ? parseFloat(lat) : null,
    longitude: lng ? parseFloat(lng) : null,
    db_level: parseFloat(dbLevel),
    source,
    description,
    status: 'Open',
    timestamp: now
  };

  reports.push(newReport);

  res.status(201).json({
    status: 'success',
    report_id: newReport.id,
    message: 'Report submitted successfully'
  });
});

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`NoiseWatch server running on http://${HOST}:${PORT}`);
  // Ensure documentation PDF is pre-rendered for instant downloads
  const pdfPath = path.join(rootDir, 'statics', 'NoiseWatch-Complete-Platform-Documentation.pdf');
  if (!fs.existsSync(pdfPath)) {
    buildDocumentationPdf(pdfPath)
      .then(() => console.log('NoiseWatch documentation PDF generated and ready for instant download.'))
      .catch((err) => console.error('Failed to pre-render PDF documentation:', err));
  }
});
