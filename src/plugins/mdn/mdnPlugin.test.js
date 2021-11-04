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

it('works', async () => {
  const spy = jest.spyOn(superagent, 'get').mockImplementation(
    asyncMock({
      ok: true,
      text:
        '<body><article><p>Foo bar</p><div class="notecard deprecated"><p>Deprecated</p></div></article></body>',
    }),
  );
  const output = await testMdn('mdn Object __proto__');

  expect(output).toEqual('DEPRECATED Foo bar https://mdn.io/Object-__proto__');

  spy.mockRestore();
});
