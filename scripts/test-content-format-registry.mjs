import assert from 'node:assert/strict';
import { CONTENT_FORMATS, CONTENT_FORMAT_IDS } from '../src/content-formats.mjs';

assert.ok(Array.isArray(CONTENT_FORMATS));
assert.equal(CONTENT_FORMATS.length, 15);
assert.equal(CONTENT_FORMAT_IDS.size, CONTENT_FORMATS.length);
assert.deepEqual([...CONTENT_FORMAT_IDS], CONTENT_FORMATS.map(x => x.id));
assert.ok(CONTENT_FORMATS.every(x => x.id && x.label && x.group && x.originHint && x.experience));
assert.equal(CONTENT_FORMATS.find(x => x.id === 'audiobook').experience, 'Catalog only · audio playback not enabled');
assert.equal(CONTENT_FORMATS.find(x => x.id === 'anime').experience, 'Catalog only · playback not enabled');
assert.equal(CONTENT_FORMATS.find(x => x.id === 'game').experience, 'Catalog only · game integration not enabled');

console.log('Content format registry module checks passed.');
