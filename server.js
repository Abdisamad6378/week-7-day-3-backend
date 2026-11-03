require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { JWT_SECRET, PORT = 4000 } = process.env;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Users live in memory, so restarting the server clears them.
const users = [];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => email.trim().toLowerCase();

const toPublicUser = ({ id, name, email, createdAt }) => ({ id, name, email, createdAt });

const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

function validateRegistration({ name, email, password }) {
  if (typeof name !== 'string' || name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return 'A valid email is required';
  }
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return 'Password must be at least 8 characters and contain one uppercase letter and one number';
  }
  return null;
}

function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((candidate) => candidate.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.post('/api/auth/register', async (req, res) => {
  const body = req.body ?? {};
  const validationError = validateRegistration(body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const email = normalizeEmail(body.email);

  if (users.some((user) => user.email === email)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);

  // Checked again because another request may have registered this email during hashing.
  if (users.some((user) => user.email === email)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = {
    id: crypto.randomUUID(),
    name: body.name.trim(),
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);

  res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = users.find((candidate) => candidate.email === normalizeEmail(email));
  const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ token: signToken(user), user: toPublicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

// Keeps framework errors, such as malformed JSON, in the same shape as the routes above.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status ?? 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: status >= 500 ? 'Something went wrong' : err.message });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
