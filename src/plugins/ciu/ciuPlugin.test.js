const test = require('tape');
const ciuPlugin = require('./ciuPlugin');

async function testCiu(message) {
  return new Promise((resolve) => {
    ciuPlugin({
      command: { command: message },
      respondWithMention: resolve,
      handling() {},
    });
  });
}

test('works with features agents', async (t) => {
  const output = await testCiu('ciu grid css');

  t.match(
    output,
    /^CSS Grid Layout \(level 1\) \(IE \d+~, Edge \d+, FF \d+, Chrome \d+, Opera \d+, Safari \d+.\d+, iOS \d+.\d+, Android \d+\) [\d.]+% https:\/\/caniuse.com\/css-grid$/,
  );
  t.end();
});

test('works with features agents 2', async (t) => {
  const output = await testCiu('ciu modules');

  t.match(
    output,
    /^JavaScript modules via script tag \(Edge \d+, FF [\d.]+, Chrome [\d.]+, Opera \d+, Safari \d+, iOS \d+\.\d+-\d+\.\d+, Android \d+\) [\d.]+% https:\/\/caniuse.com\/es6-module, see also https:\/\/caniuse.com\/es6-module-dynamic-import$/,
  );
  t.end();
});

test('works with features agents 3', async (t) => {
  const output = await testCiu('ciu subgrid');

  t.match(
    output,
    /^CSS Subgrid \(Edge [\d.]+, FF [\d.]+, Chrome [\d.]+, Opera [\d.]+, Safari (?:TP|[\d.]+), iOS [\d.]+, Android [\d.]+\) [\d.]+% https:\/\/caniuse.com\/css-subgrid$/,
  );
  t.end();
});

test('works with features agents 4', async (t) => {
  const output = await testCiu('ciu :has');

  t.match(
    output,
    /^:has\(\) CSS relational pseudo-class \(Edge [\d.]+, FF [\d.]+, Chrome [\d.]+, Opera [\d.]+, Safari [\d.]+, iOS [\d.]+, Android [\d.]+\) [\d.]+% https:\/\/caniuse.com\/css-has$/,
  );
  t.end();
});

test('works with total usage percent support rounding', async (t) => {
  const output = await testCiu('ciu keyboardevent-key');

  t.match(
    output,
    /^KeyboardEvent.key \(IE \d~, Edge [\d.]+, FF [\d.]+, Chrome [\d.]+, Opera [\d.]+, Safari [\d.]+, iOS [\d.]+, Android [\d.]+\) [\d.]+% https:\/\/caniuse.com\/keyboardevent-key$/,
  );
  t.end();
});

test('works with search', async (t) => {
  const output = await testCiu('ciu keyboard key');

  t.match(
    output,
    /^KeyboardEvent.key \(IE \d~, Edge [\d.]+, FF [\d.]+, Chrome [\d.]+, Opera [\d.]+, Safari [\d.]+, iOS [\d.]+, Android [\d.]+\) [\d.]+% https:\/\/caniuse.com\/keyboardevent-key, see also https:\/\/caniuse.com\/keyboardevent-which, https:\/\/caniuse.com\/keyboardevent-location, https:\/\/caniuse.com\/keyboardevent-code, https:\/\/caniuse.com\/keyboardevent-charcode$/,
  );
  t.end();
});
