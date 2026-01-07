const test = require('tape');
const exec = require('../exec');

test('works', async (t) => {
  const result = await exec('echo', [2]);
  t.equal(result, '2');
  t.end();
});

test('times out', async (t) => {
  try {
    await exec('sleep', [2], { timeout: 250 });
    t.fail('should have thrown');
  } catch (e) {
    t.ok(e, 'threw an error');
  }
  t.end();
});
