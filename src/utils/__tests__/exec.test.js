const exec = require('../exec');

it('works', async () => {
  expect(exec('echo', [2])).resolves.toEqual('2');
});

it('times out', async () => {
  expect(exec('sleep', [2], { timeout: 250 })).rejects.toThrow('');
});
