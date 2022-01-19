const npmPlugin = require('./npmPlugin');

async function testNpm(message) {
  return new Promise((resolve) => {
    npmPlugin({
      command: { command: message },
      respondWithMention: resolve,
      handling() {},
    });
  });
}

it('works', async () => {
  const output = await testNpm('npm bootstrap');

  const [beforeSpace, afterSpace] = output.split(' ');
  expect(beforeSpace).toEqual('npm.im/bootstrap');
  expect(afterSpace.split('|')[0]).toMatch(/^\d+\.\d+\.\d+/);
  expect(afterSpace.split('|')[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

it('works for searches', async () => {
  const output = await testNpm('npm ~bootstrap');

  const results = output.split(' ⸺ ');
  expect(results.length).toBeGreaterThan(2);

  const [beforeSpace, afterSpace] = results[0].split(' ');
  expect(beforeSpace).toEqual('npm.im/bootstrap');
  expect(afterSpace.split('|')[0]).toMatch(/^\d+\.\d+\.\d+/);
  expect(afterSpace.split('|')[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
