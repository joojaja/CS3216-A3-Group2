import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsPage, FUNNEL_EVENTS } from '../src/lib/analytics.ts';

test('analytics classifies private pages without exposing item IDs', () => {
  assert.equal(analyticsPage('/wardrobe/new'), 'add_item');
  assert.equal(analyticsPage('/wardrobe/private-item-id'), 'item_detail');
  assert.equal(analyticsPage('/planner'), 'planner');
  assert.equal(analyticsPage('/explore'), 'explore');
  assert.equal(analyticsPage('/auth/callback'), 'other');
  assert.equal(analyticsPage('/unknown-private-path'), 'other');
});
test('analytics accepts only named product events', () => {
  assert.ok(FUNNEL_EVENTS.includes('purchase_evaluated'));
  assert.ok(FUNNEL_EVENTS.includes('feedback_saved'));
  assert.ok(FUNNEL_EVENTS.includes('explore_product_opened'));
  assert.ok(!FUNNEL_EVENTS.includes('user_email'));
});
