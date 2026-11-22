import crypto from 'crypto';
import { getUsers } from './db.js';
const SECRET = process.env.SECRET || 'change-me';
const mac = (p) => crypto.createHmac('sha256', SECRET).update(p).digest('base64url');

export const hash = (pw) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
};
export const verify = (pw, stored) => {
  const [salt, h] = stored.split(':');
  return crypto.timingSafeEqual(crypto.scryptSync(pw, salt, 64), Buffer.from(h, 'hex'));
};
export const sessionCookie = (username) => {
  const p = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + 7 * 864e5 })).toString('base64url');
  return `s=${p}.${mac(p)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
};
// Logged-in user ke DB theke ber kore (delete hole sathe sathe access bondho)
export const current = async (req) => {
  const c = (req.headers.cookie || '').split('; ').find((x) => x.startsWith('s='));
  if (!c) return null;
  const [p, s] = c.slice(2).split('.');
  if (!p || s !== mac(p)) return null;
  const d = JSON.parse(Buffer.from(p, 'base64url'));
  if (d.exp < Date.now()) return null;
  const u = (await getUsers()).find((x) => x.username === d.u);
  return u ? { username: u.username, role: u.role } : null;
};
