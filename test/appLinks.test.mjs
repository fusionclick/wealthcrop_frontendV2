import test from 'node:test';
import assert from 'node:assert/strict';
import { androidDownloadLabel } from '../src/utils/appLinks.js';

test('direct Android APK URLs are distinguished from store listings and ordinary app pages', () => {
  assert.equal(androidDownloadLabel('https://downloads.example.com/Wealthcrop.APK?v=2'), 'Download Android APK');
  assert.equal(androidDownloadLabel('https://play.google.com/store/apps/details?id=co.wealthcrop.app'), 'Google Play (Android)');
  assert.equal(androidDownloadLabel('https://play.google.com.fake.example/store/apps/details'), 'Android app');
  assert.equal(androidDownloadLabel('https://wealthcrop.example/mobile'), 'Android app');
  assert.equal(androidDownloadLabel(''), 'Android app');
});
