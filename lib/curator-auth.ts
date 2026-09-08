import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'ms_curator_session';
const DAY = 60 * 60 * 24;
type Curator = { userId: string; displayName: string };

function config() {
  const values = env as unknown as Record<string, string | undefined>;
  return { login: values.CURATOR_LOGIN || '', password: values.CURATOR_PASSWORD || '', secret: values.CURATOR_SESSION_SECRET || '' };
}
const encode = (value: string) => btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const decode = (value: string) => atob(value.replaceAll('-', '+').replaceAll('_', '/'));
async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return encode(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))));
}
async function userFromToken(token: string | undefined): Promise<Curator | null> {
  if (!token) return null;
  const [payload, signature] = token.split('.'); const { secret, login } = config();
  if (!payload || !signature || !secret || signature !== (await sign(payload, secret))) return null;
  try { const data = JSON.parse(decode(payload)) as { login?: string; exp?: number }; if (data.login !== login || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null; return { userId: `curator:${login}`, displayName: login }; } catch { return null; }
}
export async function curatorUser() { return userFromToken((await cookies()).get(COOKIE)?.value); }
export async function requireCurator() { const user = await curatorUser(); if (user) return user; redirect('/login'); }
export async function validCredentials(login: string, password: string) { const current = config(); return Boolean(current.login && current.password && login === current.login && password === current.password); }
export async function sessionCookie() { const { login, secret } = config(); const payload = encode(JSON.stringify({ login, exp: Math.floor(Date.now() / 1000) + DAY })); return `${COOKIE}=${payload}.${await sign(payload, secret)}; Path=/; Max-Age=${DAY}; HttpOnly; Secure; SameSite=Lax`; }
