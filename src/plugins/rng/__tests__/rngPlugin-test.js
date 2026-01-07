const test = require('tape');
const rng = require('../rngPlugin');

test('rngPlugin works', async (t) => {
  await rng({
    command: { command: '!pick 2,3 # whatever' },
    respondWithMention: (output) => {
      t.ok(/"[23]"$/.test(output), 'output ends with "2" or "3"');
    },
  });

  await rng({
    command: { command: '!choose tea, coffee or H2O # what should I drink?' },
    respondWithMention: (output) => {
      t.ok(
        /"(tea|coffee|H2O)"$/.test(output),
        'output ends with tea, coffee, or H2O',
      );
    },
  });

  await rng({
    command: {
      command: '!which redux, mobx, or plain-context-api? # reactjs state manager',
    },
    respondWithMention: (output) => {
      t.ok(
        /"(redux|mobx|plain-context-api)"$/.test(output),
        'output ends with redux, mobx, or plain-context-api',
      );
    },
  });

  t.end();
});
