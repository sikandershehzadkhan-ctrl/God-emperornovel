import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/index.js', 'utf8');
const app = readFileSync('public/app.js', 'utf8');

const requiredApi = [
  '/api/novels', '/api/library', '/api/history', '/api/bookmarks',
  '/api/comments', '/api/comments/like', '/api/comments/report',
  '/api/novel-reactions', '/api/rating', '/api/requests',
  '/api/vote-novels', '/api/leaderboard', '/api/tier-list',
  '/api/notifications', '/api/recommendations',
  '/api/author/applications', '/api/admin/community/reports'
];
for (const route of requiredApi) {
  assert.ok(source.includes(route), `Expected existing platform API route: ${route}`);
}

const requiredPages = [
  "p==='/community'", "p==='/leaderboard'", "p==='/tier-list'",
  "p==='/vote'", "p==='/notifications'", "p==='/library'",
  "p==='/history'", "p==='/author'"
];
for (const route of requiredPages) {
  assert.ok(app.includes(route), `Expected existing platform page route: ${route}`);
}

// These are deliberate gap guards, not feature claims. When a real end-to-end
// implementation lands, update the register and replace the relevant guard
// with positive API, UI, authorization and migration assertions.
const pendingFeatureMarkers = [
  ['/api/community/folders', 'public reader collections'],
  ['/api/community/polls', 'community polls'],
  ['/api/community/tournaments', 'reader tier-list tournaments'],
  ['/api/community/awards', 'reader awards']
];
for (const [marker, feature] of pendingFeatureMarkers) {
  assert.ok(!source.includes(marker), `${feature} inventory changed: update the competitor gap register and add end-to-end tests`);
}

console.log('Platform capability inventory passed: existing core routes are present and unimplemented WTR-Lab parity features remain explicitly unclaimed.');
