import authMdl from '../models/authMdl.js';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function getCredentials(body = {}) {
    return {
        name: typeof body.name === 'string' ? body.name.trim() : '',
        email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
        password: typeof body.password === 'string' ? body.password : '',
    };
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendAuthError(res, error, context) {
    if (error.code === 'INVALID_INPUT') {
        return res.status(400).json({ message: error.message });
    }
    if (error.code === 'EMAIL_EXISTS') {
        return res.status(409).json({ message: error.message });
    }
    if (error.code === 'INVALID_CREDENTIALS') {
        return res.status(401).json({ message: error.message });
    }

    console.error(`Auth ${context} failed`, error);
    return res.status(500).json({ message: 'Authentication is temporarily unavailable.' });
}

async function signUp(req, res) {
    const { name, email, password } = getCredentials(req.body);

    if (name.length < 2 || !isValidEmail(email) || password.length < 8) {
        return res.status(400).json({
            message: 'Provide a name, a valid email, and a password with at least 8 characters.',
        });
    }

    try {
        const userId = await authMdl.createUser(name, email, password);
        return res.status(201).json({ message: 'Account created successfully.', userId });
    } catch (error) {
        return sendAuthError(res, error, 'sign-up');
    }
}

async function logIn(req, res) {
    const { email, password } = getCredentials(req.body);

    if (!isValidEmail(email) || !password) {
        return res.status(400).json({ message: 'Provide a valid email and password.' });
    }

    try {
        const user = await authMdl.retrieveUser(email, password);
        const payload = {
            id: user.id,
            role: user.role,
        };
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) {
            throw new Error('ACCESS_TOKEN_SECRET is not configured.');
        }
        const token = jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
        });

        return res.status(200).json({
            message: 'Signed in successfully.',
            user,
        });
    } catch (error) {
        return sendAuthError(res, error, 'log-in');
    }
}

function logOut(req, res) {
    res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });

    return res.status(200).json({ message: 'Signed out successfully.' });
}

export default { signUp, logIn, logOut };
