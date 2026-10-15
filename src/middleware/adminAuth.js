import jwt from 'jsonwebtoken';
import authMdl from '../models/authMdl.js';

export function setAuthViewState(req, res, next) {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const token = req.cookies?.access_token;

    res.locals.isLoggedIn = false;
    res.locals.isAdmin = false;
    if (!secret || !token) return next();

    try {
        const payload = jwt.verify(token, secret);
        const userId = Number(payload.id);
        if (Number.isSafeInteger(userId) && userId > 0) {
            res.locals.isLoggedIn = true;
            res.locals.isAdmin = payload.role === 'admin';
        }
    } catch {
        res.locals.isLoggedIn = false;
        res.locals.isAdmin = false;
    }

    return next();
}

export async function requireAdmin(req, res, next) {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const token = req.cookies?.access_token;

    if (!secret) {
        console.error('Admin access unavailable: ACCESS_TOKEN_SECRET is not configured.');
        return res.status(500).json({ message: 'Admin access is temporarily unavailable.' });
    }
    if (!token) {
        return res.status(401).json({ message: 'Sign in with an admin account to continue.' });
    }

    let payload;
    try {
        payload = jwt.verify(token, secret);
    } catch {
        return res.status(401).json({ message: 'Your sign-in has expired. Please sign in again.' });
    }

    const userId = Number(payload.id);
    if (!Number.isSafeInteger(userId) || userId < 1) {
        return res.status(401).json({ message: 'Your sign-in is invalid. Please sign in again.' });
    }

    try {
        const role = await authMdl.GetUserRoleById(userId);
        if (role !== 'admin') {
            return res.status(403).json({ message: 'Admin access is required.' });
        }

        req.authUser = { id: userId, role };
        return next();
    } catch (error) {
        console.error('Failed to verify admin role', error);
        return res.status(500).json({ message: 'Admin access is temporarily unavailable.' });
    }
}
