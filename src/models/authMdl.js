import db from '../config/db.js';
import bcrypt from 'bcrypt';


const dbp = db.promise();

function createAuthError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

async function lookForEmail(email) {
    const q = 'SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1';
    const [rows] = await dbp.execute(q, [email]);
    return rows[0] || null;
}

async function createUser(name, email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await lookForEmail(normalizedEmail);

    if (existingUser) {
        throw createAuthError('EMAIL_EXISTS', 'An account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 13);
    const q = 'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())';

    try {
        const [result] = await dbp.execute(q, [name.trim(), normalizedEmail, hashedPassword, 'user']);
        return result.insertId;
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw createAuthError('EMAIL_EXISTS', 'An account with this email already exists.');
        }
        throw error;
    }
}

async function GetUserRoleById(id) {
    const [rows] = await dbp.execute('SELECT role FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0]?.role || null;
}

async function retrieveUser(email, password) {
    const user = await lookForEmail(email.trim().toLowerCase());

    if (!user) {
        throw createAuthError('INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }

    const storedPassword = user.password;
    const isBcryptHash = typeof storedPassword === 'string'
        && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedPassword);
    let passwordMatches = false;

    if (isBcryptHash) {
        passwordMatches = await bcrypt.compare(password, storedPassword);
    } else if (typeof storedPassword === 'string' && password === storedPassword) {
        const hashedPassword = await bcrypt.hash(password, 13);
        await dbp.execute(
            'UPDATE users SET password = ? WHERE id = ? AND password = ?',
            [hashedPassword, user.id, storedPassword],
        );
        passwordMatches = true;
    }

    if (!passwordMatches) {
        throw createAuthError('INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
}

export default { createUser, retrieveUser, GetUserRoleById };
