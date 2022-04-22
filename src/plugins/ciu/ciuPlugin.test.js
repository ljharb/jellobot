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

it('works with features agents', async () => {
  const output = await testCiu('ciu grid css');

  expect(output).toMatch(
    /^CSS Grid Layout \(level 1\) \(IE \d+~, Edge \d+, FF \d+, Chrome \d+, Opera \d+, Safari \d+.\d+, iOS \d+.\d+, Android \d+\) [\d.]+% https:\/\/caniuse.com\/css-grid$/,
  );
});

it('works with features agents 2', async () => {
  const output = await testCiu('ciu modules');

  expect(output).toMatch(
    /^JavaScript modules via script tag \(Edge \d+, FF [\d.]+, Chrome [\d.]+, Opera \d+, Safari \d+, iOS \d+\.\d+-\d+\.\d+, Android \d+\) [\d.]+% https:\/\/caniuse.com\/es6-module, see also https:\/\/caniuse.com\/es6-module-dynamic-import$/,
  );
});

it('works with features agents 3', async () => {
  const output = await testCiu('ciu subgrid');

  expect(output).toMatch(
    /^CSS Subgrid \(FF [\d.]+, Safari TP\) [\d.]+% https:\/\/caniuse.com\/css-subgrid$/,
  );
});

it('works with features agents 4', async () => {
  const output = await testCiu('ciu :has');

  expect(output).toMatch(
    /^:has\(\) CSS relational pseudo-class \(Safari [\d.]+, iOS [\d.]+\) [\d.]+% https:\/\/caniuse.com\/css-has$/,
  );
});

it('works with total usage percent support rounding', async () => {
  const output = await testCiu('ciu keyboardevent-key');

  expect(output).toMatch(
    /^KeyboardEvent.key \(IE \d~, Edge [\d.]+, FF [\d.]+, Chrome [\d.]+, Opera [\d.]+, Safari [\d.]+, iOS [\d.]+, Android [\d.]+\) [\d.]+% https:\/\/caniuse.com\/keyboardevent-key$/,
  );
});

it('works with search', async () => {
  const output = await testCiu('ciu keyboard key');

  expect(output).toMatch(
    /^KeyboardEvent.key \(IE \d~, Edge [\d.]+, FF [\d.]+, Chrome [\d.]+, Opera [\d.]+, Safari [\d.]+, iOS [\d.]+, Android [\d.]+\) [\d.]+% https:\/\/caniuse.com\/keyboardevent-key, see also https:\/\/caniuse.com\/keyboardevent-which, https:\/\/caniuse.com\/keyboardevent-location, https:\/\/caniuse.com\/keyboardevent-code, https:\/\/caniuse.com\/keyboardevent-charcode$/,
  );
});
