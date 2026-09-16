export async function POST() {
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': 'ms_curator_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax' } });
}
