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

  expect(output.split('|')[0]).toEqual('npm.im/bootstrap');
  expect(output.split('|')[1]).toMatch(/^\d+\.\d+\.\d+/);
  expect(output.split('|')[2]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

it('works for searches', async () => {
  const output = await testNpm('npm ~bootstrap');

  const results = output.split(' ⸺ ');
  expect(results.length).toBeGreaterThan(2);

  expect(results[0].split('|')[0]).toEqual('npm.im/bootstrap');
  expect(results[0].split('|')[1]).toMatch(/^\d+\.\d+\.\d+/);
  expect(results[0].split('|')[2]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
