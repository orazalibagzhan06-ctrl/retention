import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'ms_curator_session';
const DAY = 60 * 60 * 24;
export type UserRole = 'admin' | 'specialist' | 'conversation' | 'curator';
export type Curator = { userId: string; displayName: string; role: UserRole; month: 'jul' | 'aug' | 'sep' | null };
type Account = { login: string; password: string; displayName: string; role: UserRole; month?: 'jul' | 'aug' | 'sep' };

function config() {
  const values = env as unknown as Record<string, string | undefined>;
  let accounts: Account[] = [];
  try { accounts = JSON.parse(values.MS_ACCOUNTS || '[]') as Account[]; } catch {}
  if (values.CONVERSATION_LOGIN && values.CONVERSATION_PASSWORD) {
    accounts = accounts.filter((account) => account.login !== values.CONVERSATION_LOGIN);
    accounts.unshift({ login: values.CONVERSATION_LOGIN, password: values.CONVERSATION_PASSWORD, displayName: values.CONVERSATION_NAME || 'Жеке сөйлесу', role: 'conversation' });
  }
  if (!accounts.length && values.CURATOR_LOGIN && values.CURATOR_PASSWORD) accounts = [{ login: values.CURATOR_LOGIN, password: values.CURATOR_PASSWORD, displayName: 'Админ', role: 'admin' }];
  return { accounts, secret: values.CURATOR_SESSION_SECRET || '' };
}
const encode = (value: string) => btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const decode = (value: string) => atob(value.replaceAll('-', '+').replaceAll('_', '/'));
async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return encode(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))));
}
async function userFromToken(token: string | undefined): Promise<Curator | null> {
  if (!token) return null;
  const [payload, signature] = token.split('.'); const { secret, accounts } = config();
  if (!payload || !signature || !secret || signature !== (await sign(payload, secret))) return null;
  try {
    const data = JSON.parse(decode(payload)) as { login?: string; exp?: number };
    const account = accounts.find((item) => item.login === data.login);
    if (!account || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: `account:${account.login}`, displayName: account.displayName, role: account.role, month: account.month || null };
  } catch { return null; }
}
export async function curatorUser() { return userFromToken((await cookies()).get(COOKIE)?.value); }
export async function requireCurator() { const user = await curatorUser(); if (user) return user; redirect('/login'); }
export async function validCredentials(login: string, password: string) { return config().accounts.find((account) => account.login === login && account.password === password) || null; }
export async function sessionCookie(account: Account) {
  const { secret } = config(); const payload = encode(JSON.stringify({ login: account.login, exp: Math.floor(Date.now() / 1000) + DAY }));
  return `${COOKIE}=${payload}.${await sign(payload, secret)}; Path=/; Max-Age=${DAY}; HttpOnly; Secure; SameSite=Lax`;
}
