import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveChatTitle } from '../database.js';

test('derives a readable chat title from a user message', () => {
  assert.equal(deriveChatTitle('Please review this JavaScript function', 'snippet.js'), 'JavaScript function');
});

test('uses the uploaded filename when provided', () => {
  assert.equal(deriveChatTitle('Uploaded file', 'profile.ts'), 'profile.ts');
});
