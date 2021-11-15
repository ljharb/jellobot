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

  expect(output).toBe(
    'CSS Grid Layout (level 1) (IE 9~, Edge 16, FF 52, Chrome 57, Opera 44, Safari 10.1, iOS 10.3, Android 95) 96.64% https://caniuse.com/css-grid',
  );
});

it('works with features agents 2', async () => {
  const output = await testCiu('ciu modules');

  expect(output).toBe(
    'JavaScript modules via script tag (Edge 16, FF 60, Chrome 61, Opera 48, Safari 11, iOS 11.0-11.2, Android 95) 94.56% https://caniuse.com/es6-module, see also https://caniuse.com/es6-module-dynamic-import',
  );
});

it('works with features agents 3', async () => {
  const output = await testCiu('ciu subgrid');

  expect(output).toBe('CSS Subgrid (FF 71) 3.37% https://caniuse.com/css-subgrid');
});

it('works with features agents 4', async () => {
  const output = await testCiu('ciu :has');

  expect(output).toBe(
    ':has() CSS relational pseudo-class  0% https://caniuse.com/css-has',
  );
});

it('works with total usage percent support rounding', async () => {
  const output = await testCiu('ciu keyboardevent-key');

  expect(output).toBe(
    'KeyboardEvent.key (IE 9~, Edge 79, FF 29, Chrome 51, Opera 12.1, Safari 10.1, iOS 10.3, Android 95) 97.98% https://caniuse.com/keyboardevent-key',
  );
});

it('works with search', async () => {
  const output = await testCiu('ciu keyboard key');

  expect(output).toBe(
    'KeyboardEvent.key (IE 9~, Edge 79, FF 29, Chrome 51, Opera 12.1, Safari 10.1, iOS 10.3, Android 95) 97.98% https://caniuse.com/keyboardevent-key, see also https://caniuse.com/keyboardevent-which, https://caniuse.com/keyboardevent-location, https://caniuse.com/keyboardevent-code, https://caniuse.com/keyboardevent-charcode',
  );
});
