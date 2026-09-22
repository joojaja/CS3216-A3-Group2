import test from 'node:test';
import assert from 'node:assert/strict';
import { redactAnalyticsUrl, redactSpeedInsightsEvent } from '../src/lib/vercel-analytics.ts';

test('redactAnalyticsUrl leaves public paths unchanged', () => {
  assert.equal(redactAnalyticsUrl('https://wearabouts.app/'), 'https://wearabouts.app/');
  assert.equal(redactAnalyticsUrl('https://wearabouts.app/wardrobe/new'), 'https://wearabouts.app/wardrobe/new');
});

test('redactAnalyticsUrl hides wardrobe item IDs and strips query and hash', () => {
  assert.equal(
    redactAnalyticsUrl('https://wearabouts.app/wardrobe/abc-123?x=1#y'),
    'https://wearabouts.app/wardrobe/item',
  );
  assert.equal(
    redactAnalyticsUrl('https://wearabouts.app/planner?occasion=wedding'),
    'https://wearabouts.app/planner',
  );
});

test('redactAnalyticsUrl drops auth routes that carry codes', () => {
  assert.equal(redactAnalyticsUrl('https://wearabouts.app/auth/callback?code=secret'), null);
  assert.equal(redactAnalyticsUrl('https://wearabouts.app/auth/confirm'), null);
});

test('Speed Insights redacts the URL and route before sending vitals', () => {
  assert.deepEqual(
    redactSpeedInsightsEvent({
      type: 'vital',
      url: 'https://wearabouts.app/wardrobe/item-123?filter=private#top',
      route: '/wardrobe/item-123',
    }),
    {
      type: 'vital',
      url: 'https://wearabouts.app/wardrobe/item',
      route: '/wardrobe/item',
    },
  );
  assert.equal(
    redactSpeedInsightsEvent({
      type: 'vital',
      url: 'https://wearabouts.app/auth/callback?code=secret',
      route: '/auth/callback',
    }),
    null,
  );
});
