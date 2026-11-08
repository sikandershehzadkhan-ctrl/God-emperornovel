import assert from 'node:assert/strict';
import { handleCommunityCollectionsRequest } from '../src/features/community-collections/index.mjs';

const invalidBodies = [null, [], 'not-an-object', 17, false];
const routes = [
  { pathname: '/api/community/collections', method: 'POST' },
  { pathname: '/api/community/collections/7', method: 'PATCH' },
  { pathname: '/api/community/collections/7/items', method: 'POST' }
];

for (const route of routes) {
  for (const value of invalidBodies) {
    let databaseCalls = 0;
    const response = await handleCommunityCollectionsRequest({
      req: { method: route.method },
      env: { DB: { prepare() { databaseCalls++; throw new Error('DB must not be touched for invalid request bodies'); } } },
      url: new URL(route.pathname, 'https://imperial.example'),
      u: { id: 42 },
      body: async () => value,
      json: (data, status = 200) => ({ data, status }),
      need: () => null
    });
    assert.equal(response.status, 400, route.method + ' ' + route.pathname + ' must reject ' + String(value));
    assert.equal(databaseCalls, 0, 'invalid request bodies must be rejected before database access');
    assert.equal(response.data.error, 'Request body must be a JSON object.');
  }
}

{
  let databaseCalls = 0;
  const response = await handleCommunityCollectionsRequest({
    req: { method: 'POST' },
    env: { DB: { prepare() { databaseCalls++; throw new Error('DB must not be touched for invalid title types'); } } },
    url: new URL('/api/community/collections', 'https://imperial.example'),
    u: { id: 42 },
    body: async () => ({ title: { injected: 'object' }, description: ['not', 'text'] }),
    json: (data, status = 200) => ({ data, status }),
    need: () => null
  });
  assert.equal(response.status, 400);
  assert.equal(response.data.error, 'A collection title is required.');
  assert.equal(databaseCalls, 0);
}

{
  const statements = [];
  const env = { DB: { prepare(sql) {
    return { bind(...args) {
      statements.push({ sql, args });
      return { async first() {
        return sql.startsWith('SELECT COUNT(*)')
          ? { total: 0 }
          : { id: 9, title: 'Shelf', description: '', visibility: 'private' };
      } };
    } };
  } } };
  const response = await handleCommunityCollectionsRequest({
    req: { method: 'POST' },
    env,
    url: new URL('/api/community/collections', 'https://imperial.example'),
    u: { id: 42 },
    body: async () => ({ title: ' Shelf ', description: { unexpected: 'object' } }),
    json: (data, status = 200) => ({ data, status }),
    need: () => null
  });
  assert.equal(response.status, 201);
  const insert = statements.find(x => x.sql.startsWith('INSERT INTO community_collections'));
  assert.deepEqual(insert.args, [42, 'Shelf', '', 'private'], 'non-string description must be stored as an empty string');
}

console.log('Reader collection request-body runtime tests passed.');
