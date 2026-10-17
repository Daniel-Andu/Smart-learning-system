const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { query, pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
    return { accessToken, refreshToken };
};

const createVerificationCode = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');
const hashVerificationCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

async function deliverVerificationCode(email, code) {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const hasSmtpCredentials = smtpUser && smtpPass &&
        !/^(your_|placeholder|example|test|demo)/i.test(smtpUser) &&
        !/^(your_|placeholder|example|test|demo)/i.test(smtpPass) &&
        smtpUser !== 'your_email@gmail.com' &&
        smtpPass !== 'your_email_password';

    // Always show development code in development mode or when SMTP is not configured
    if (!hasSmtpCredentials || process.env.NODE_ENV === 'development') {
        console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
        return false;
    }

    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
        from: process.env.SMTP_FROM || smtpUser,
        to: email,
        subject: 'Your EduVerse verification code',
        text: `Your EduVerse verification code is ${code}. It expires in 10 minutes.`,
    });
    return true;
}

async function issueVerificationCode(user) {
    const code = createVerificationCode();
    await query(
        `INSERT INTO email_verification_codes (user_id, code_hash, attempts, expires_at, created_at)
         VALUES ($1, $2, 0, NOW() + INTERVAL '10 minutes', NOW())
         ON CONFLICT (user_id) DO UPDATE
         SET code_hash = $2, attempts = 0, expires_at = NOW() + INTERVAL '10 minutes', created_at = NOW()`,
        [user.id, hashVerificationCode(code)]
    );

    const delivered = await deliverVerificationCode(user.email, code);
    return {
        verificationRequired: true,
        email: user.email,
        message: delivered ? 'A verification code was sent to your email.' : 'Enter the development verification code shown below.',
        // Always include development code for testing when email is not sent
        development_code: code,
    };
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, role = 'student' } = req.body;
        if (
            typeof name !== 'string' || !name.trim() ||
            typeof email !== 'string' || !email.trim() ||
            typeof password !== 'string' || !password
        ) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (!['student', 'instructor'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const normalizedEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({ error: 'Enter a valid email address' });
        }
        const existing = await query('SELECT id, name, email, role, is_email_verified FROM users WHERE email = $1', [normalizedEmail]);
        if (existing.rows.length && existing.rows[0].is_email_verified) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        let user = existing.rows[0];
        if (!user) {
            const passwordHash = await bcrypt.hash(password, 12);
            const result = await query(
                `INSERT INTO users (name, email, password_hash, role, is_email_verified)
                 VALUES ($1, $2, $3, $4, false)
                 RETURNING id, name, email, role`,
                [name.trim(), normalizedEmail, passwordHash, role]
            );
            user = result.rows[0];
        }

        const verification = await issueVerificationCode(user);
        res.status(202).json(verification);
    } catch (err) { next(err); }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res, next) => {
    try {
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const result = await query(
            'SELECT id, email FROM users WHERE email = $1 AND is_email_verified = false',
            [email]
        );
        if (!result.rows.length) {
            return res.json({ message: 'If the account needs verification, a code has been sent.' });
        }

        const verification = await issueVerificationCode(result.rows[0]);
        res.json({
            message: verification.message,
            development_code: verification.development_code,
        });
    } catch (err) { next(err); }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
    if (!email || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: 'A valid email and six-digit verification code are required' });
    }

    let client;
    let transactionStarted = false;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        transactionStarted = true;
        const result = await client.query(
            `SELECT u.id, u.name, u.email, u.role, v.code_hash, v.expires_at, v.attempts
             FROM email_verification_codes v
             JOIN users u ON u.id = v.user_id
             WHERE u.email = $1 AND u.is_email_verified = false
             FOR UPDATE OF v`,
            [email]
        );
        if (!result.rows.length) {
            await client.query('ROLLBACK');
            transactionStarted = false;
            return res.status(400).json({ error: 'Verification code is invalid or expired' });
        }

        const verification = result.rows[0];
        if (verification.attempts >= 5) {
            await client.query('DELETE FROM email_verification_codes WHERE user_id = $1', [verification.id]);
            await client.query('COMMIT');
            transactionStarted = false;
            return res.status(429).json({ error: 'Too many incorrect attempts. Request a new code.' });
        }
        if (new Date(verification.expires_at) <= new Date()) {
            await client.query('DELETE FROM email_verification_codes WHERE user_id = $1', [verification.id]);
            await client.query('COMMIT');
            transactionStarted = false;
            return res.status(400).json({ error: 'Verification code has expired. Request a new code.' });
        }

        const submittedHash = Buffer.from(hashVerificationCode(code), 'hex');
        const storedHash = Buffer.from(verification.code_hash, 'hex');
        if (!crypto.timingSafeEqual(submittedHash, storedHash)) {
            await client.query(
                'UPDATE email_verification_codes SET attempts = attempts + 1 WHERE user_id = $1',
                [verification.id]
            );
            await client.query('COMMIT');
            transactionStarted = false;
            return res.status(400).json({ error: 'Verification code is incorrect' });
        }

        await client.query('UPDATE users SET is_email_verified = true, last_login_at = NOW() WHERE id = $1', [verification.id]);
        await client.query('DELETE FROM email_verification_codes WHERE user_id = $1', [verification.id]);
        await client.query(
            `INSERT INTO user_sessions (user_id, ip_address, user_agent, last_activity)
             VALUES ($1, $2, $3, NOW())`,
            [verification.id, req.ip, req.get('user-agent') || null]
        );
        await client.query('COMMIT');
        transactionStarted = false;

        const { accessToken, refreshToken } = generateTokens(verification.id);
        const { code_hash, expires_at, attempts, ...user } = verification;
        res.json({ user, accessToken, refreshToken });
    } catch (err) {
        if (client && transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Failed to roll back email verification transaction:', rollbackError.message);
            }
        }
        next(err);
    } finally {
        if (client) client.release();
    }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        if (role && user.role !== role) return res.status(403).json({ error: `Not a ${role} account` });
        if (!user.is_active) return res.status(403).json({ error: 'Account deactivated' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        if (!user.is_email_verified) return res.status(403).json({ error: 'Please verify your email before signing in' });

        await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
        await query(
            `INSERT INTO user_sessions (user_id, ip_address, user_agent, last_activity)
             VALUES ($1, $2, $3, NOW())`,
            [user.id, req.ip, req.get('user-agent') || null]
        );

        const { accessToken, refreshToken } = generateTokens(user.id);
        const { password_hash, ...safeUser } = user;
        res.json({ user: { ...safeUser, last_login_at: new Date() }, accessToken, refreshToken });
    } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.userId);
        res.json({ accessToken, refreshToken: newRefresh });
    } catch (err) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
