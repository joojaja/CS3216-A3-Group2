import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsPage, FUNNEL_EVENTS, isActivationMilestone, ACTIVATION_ITEM_COUNT } from '../src/lib/analytics.ts';

test('analytics classifies private pages without exposing item IDs', () => {
  assert.equal(analyticsPage('/wardrobe/new'), 'add_item');
  assert.equal(analyticsPage('/wardrobe/private-item-id'), 'item_detail');
  assert.equal(analyticsPage('/planner'), 'planner');
  assert.equal(analyticsPage('/explore'), 'explore');
  assert.equal(analyticsPage('/auth/callback'), 'other');
  assert.equal(analyticsPage('/unknown-private-path'), 'other');
});

test('analytics classifies every routed page, so a route change always gets a page_view', () => {
  assert.equal(analyticsPage('/sizing'), 'sizing');
  assert.equal(analyticsPage('/profile/measurements'), 'measurements');
  assert.equal(analyticsPage('/profile'), 'profile');
});
test('analytics accepts only named product events', () => {
  assert.ok(FUNNEL_EVENTS.includes('purchase_evaluated'));
  assert.ok(FUNNEL_EVENTS.includes('feedback_saved'));
  assert.ok(FUNNEL_EVENTS.includes('explore_product_opened'));
  assert.ok(!FUNNEL_EVENTS.includes('user_email'));
});

test('the funnel dictionary covers the acquisition, activation and AI-trust events', () => {
  for (const name of [
    'sign_up_started',
    'sign_up_completed',
    'onboarding_completed',
    'wardrobe_activated',
    'item_attributes_corrected',
    'item_analysis_failed',
    'item_analysis_retried',
    'outfit_retried',
    'sizing_requested',
    'sizing_result',
    'pricing_viewed',
  ]) {
    assert.ok(FUNNEL_EVENTS.includes(name), `expected ${name} in FUNNEL_EVENTS`);
  }
});

test('isActivationMilestone fires on the fifth saved item only', () => {
  assert.equal(ACTIVATION_ITEM_COUNT, 5);
  assert.equal(isActivationMilestone(5), true);
  assert.equal(isActivationMilestone(1), false);
  assert.equal(isActivationMilestone(4), false);
  assert.equal(isActivationMilestone(6), false);
  assert.equal(isActivationMilestone(0), false);
});
