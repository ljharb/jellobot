const test = require('tape');
const superagent = require('superagent');
const mdnPlugin = require('./mdnPlugin');

async function testMdn(message) {
  return new Promise((resolve) => {
    mdnPlugin({
      command: { command: message },
      respondWithMention: resolve,
      handling() {},
    });
  });
}

const asyncMock = (v) =>
  new Proxy(
    {},
    {
      get: (_, k) => (k === 'then' ? (r) => r(v) : () => asyncMock(v)),
    },
  );

test('works', async (t) => {
  const originalGet = superagent.get;
  superagent.get = () =>
    asyncMock({
      ok: true,
      text: '<body><article><p>Foo bar</p><div class="notecard deprecated"><p>Deprecated</p></div></article></body>',
    });

  const output = await testMdn('mdn Object __proto__');

  t.equal(output, 'DEPRECATED Foo bar https://mdn.io/Object-__proto__');

  superagent.get = originalGet;
  t.end();
});
