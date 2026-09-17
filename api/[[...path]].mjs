import worker from '../dist/server/index.js';

export default async function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost';
  const init = { method: req.method, headers: req.headers };
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) init.body = req;
  const response = await worker.fetch(new Request(`${protocol}://${host}${req.url}`, init));
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.send(Buffer.from(await response.arrayBuffer()));
}
