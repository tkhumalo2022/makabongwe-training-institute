import assert from 'node:assert/strict';
import {before, after, test} from 'node:test';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';

let server;
let origin;
before(async () => {
  const socket = createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  origin = `http://localhost:${port}`;
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '-H', 'localhost'], {
    cwd: new URL('..', import.meta.url),
    env: {...process.env, VERCEL_ENV: 'preview'},
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error('Test server exited before startup. Run the build first.');
    try { if ((await fetch(origin + '/admin/login')).ok) return; } catch {}
    await delay(100);
  }
  throw new Error('Test server did not start.');
});
after(async () => {
  if (server && server.exitCode === null) {
    const exited = new Promise(resolve => server.once('exit', resolve));
    server.kill('SIGTERM');
    await exited;
  }
});

test('credential forms submit by POST even without JavaScript', async () => {
  const login = await (await fetch(origin + '/admin/login')).text();
  assert.match(login.match(/<form\b[^>]*>/)?.[0] || '', /method="post"/i);
  const demo = await fetch(origin + '/api/auth/login', {
    method: 'POST', headers: {origin, 'content-type': 'application/json'}, body: '{"demo":true}',
  });
  assert.equal(demo.status, 200);
  const cookie = demo.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  const reset = await (await fetch(origin + '/admin/reset-password', {headers: {cookie}})).text();
  assert.match(reset.match(/<form\b[^>]*>/)?.[0] || '', /method="post"/i);
});

test('auth endpoints reject non-object JSON with a controlled client error', async () => {
  for (const path of ['login', 'request-link', 'session', 'update-password']) {
    for (const body of ['null', '[]', '"text"']) {
      const response = await fetch(origin + '/api/auth/' + path, {
        method: 'POST', headers: {origin, 'content-type': 'application/json'}, body,
      });
      assert.equal(response.status, 400, `${path} with ${body}`);
      assert.equal((await response.json()).ok, false);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  }
});

test('demo login rejects cross-origin submissions', async () => {
  const response = await fetch(origin + '/api/auth/login', {
    method: 'POST', headers: {origin: 'https://other.example', 'content-type': 'application/json'}, body: '{"demo":true}',
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('set-cookie'), null);
});


test('staff operations routes require login, and preview sessions show only labelled samples', async () => {
  const routes = [
    '/admin/applications',
    '/admin/applications/demo-application-01',
    '/admin/enquiries',
  ];
  for (const route of routes) {
    const response = await fetch(origin + route, {redirect: 'manual'});
    assert.ok([302, 303, 307, 308].includes(response.status), route + ' anonymous status');
    assert.match(response.headers.get('location') ?? '', /\/admin\/login/);
    assert.equal(response.headers.get('set-cookie'), null);
  }

  const response = await fetch(origin + '/api/auth/login', {
    method: 'POST',
    headers: {origin, 'content-type': 'application/json'},
    body: '{"demo":true}',
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');

  const applications = await fetch(origin + '/admin/applications', {headers: {cookie}});
  assert.equal(applications.status, 200);
  const appHtml = await applications.text();
  assert.match(appHtml, /Preview-only applications/);
  assert.match(appHtml, /Sample Applicant One/);

  const enquiries = await fetch(origin + '/admin/enquiries', {headers: {cookie}});
  assert.equal(enquiries.status, 200);
  const enquiriesHtml = await enquiries.text();
  assert.match(enquiriesHtml, /Sample enquiries, not real prospects/);

  const record = await fetch(origin + '/admin/applications/demo-application-01', {headers: {cookie}});
  assert.equal(record.status, 200);
  assert.match(await record.text(), /Illustrative preview record/);
});
