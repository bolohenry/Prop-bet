import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSimilarName } from './matching.js';

test('substring match: typed name is contained in candidate', () => {
  assert.equal(isSimilarName('Uncle Bob', 'Bob'), true);
});

test('substring match: candidate is contained in typed name', () => {
  assert.equal(isSimilarName('Bob', 'Uncle Bob'), true);
});

test('case-insensitive match', () => {
  assert.equal(isSimilarName('UNCLE BOB', 'bob'), true);
});

test('exact match (case-insensitive) returns false — handled separately as an exact match', () => {
  assert.equal(isSimilarName('Uncle Bob', 'uncle bob'), false);
});

test('no relation returns false', () => {
  assert.equal(isSimilarName('Uncle Bob', 'Aunt Sue'), false);
});

test('trims whitespace before comparing', () => {
  assert.equal(isSimilarName('Uncle Bob', '  Bob  '), true);
});

test('empty typed name returns false', () => {
  assert.equal(isSimilarName('Uncle Bob', ''), false);
});
