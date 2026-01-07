const test = require('tape');
const cp = require('child_process');
const jsEval = require('../jsEvalPlugin');

let dockerAvailable = true;
try {
  cp.execSync(`${__dirname}/../init`);
} catch (e) {
  dockerAvailable = false;
}

async function testEval(message, opts = {}) {
  return new Promise((resolve) => {
    jsEval({
      ...opts,
      message,
      respond: resolve,
      ...(process.env.MOCK_DOCKER && {
        dockerCmd: `${__dirname}/../duck`,
        runFilePath: `${__dirname}/../run.js`,
      }),
    });
  });
}

const maybeTest = dockerAvailable ? test : test.skip;

maybeTest('jsEvalPlugin works', async (t) => {
  const output = await testEval('n> 2+2');
  t.equal(output, '(okay) 4');

  const output2 = await testEval('n> setTimeout(() => console.log(2), 1000); 1');
  t.equal(output2, '(okay) 12');

  const output3 = await testEval('n> console.warn("test")');
  t.equal(output3, '(okay) test');

  t.end();
});

maybeTest('jsEvalPlugin errors when it should', async (t) => {
  const output = await testEval('n> 2++2');
  t.equal(
    output,
    '(fail) SyntaxError: Invalid left-hand side expression in postfix operation',
  );

  const output2 = await testEval('n> throw 2');
  t.equal(output2, '(fail) 2');

  const output3 = await testEval('n> throw new TypeError(2)');
  t.equal(output3, '(fail) TypeError: 2');

  t.end();
});

maybeTest('jsEvalPlugin times out but return temporary result', async (t) => {
  const output = await testEval('n> setTimeout(() => console.log(2), 10000); 1', {
    selfConfig: { timer: 2000 },
  });
  t.equal(output, '(timeout) 1');

  t.end();
});

maybeTest('jsEvalPlugin exposes node core modules', async (t) => {
  const output = await testEval(
    `n> fs.writeFileSync('foo', '..'); process.nextTick(() => fs.unlinkSync('foo')); child_process.execSync('cat foo')+''`,
  );
  t.equal(output, `(okay) '..'`);

  t.end();
});

maybeTest('jsEvalPlugin replies to user', async (t) => {
  const output = await testEval(`n>'ok'`, { mentionUser: 'jay' });
  t.equal(output, `jay, 'ok'`);

  t.end();
});

maybeTest('jsEvalPlugin handles empty input', async (t) => {
  const output = await testEval(`n>  `);
  t.equal(output, '(okay) undefined');

  t.end();
});

maybeTest('babel runs with b>', async (t) => {
  const output = await testEval(
    `b> class A { x = 3n; ok = () => this.x }; new A().ok()`,
  );
  t.equal(output, '(okay) 3n');

  t.end();
});

maybeTest('babel has String.prototype.matchAll', async (t) => {
  const output = await testEval(`b> [...'1 2 3'.matchAll(/\\d/g)].map(o => o.index)`);
  t.equal(output, '(okay) [ 0, 2, 4 ]');

  t.end();
});

maybeTest('babel has pipelines', async (t) => {
  const output = await testEval(`b> 2 |> % + 1`);
  t.equal(output, '(okay) 3');

  t.end();
});

maybeTest('top-level-await works', async (t) => {
  t.deepEqual(
    [
      await testEval('n> var x = await Promise.resolve(2n); x'),
      await testEval('b> var x = await Promise.resolve(2n); x'),
      await testEval('n> var x = await Promise.resolve(2n); if (x) {}'),
      await testEval('b> var x = await Promise.resolve(2n); if (x) {}'),
      await testEval(
        `n> function foo(){}; let o={[await 'foo']: await eval('1')}; o`,
      ),
    ],
    [
      '(okay) 2n',
      '(okay) 2n',
      '(okay) undefined',
      '(okay) undefined',
      '(okay) { foo: 1 }',
    ],
  );

  t.end();
});

maybeTest('top-level-await works with comments', async (t) => {
  const output = await testEval('n> let x=await `wat`; x // test');
  t.equal(output, `(okay) 'wat'`);

  const output2 = await testEval('b> await `wat` // test');
  t.equal(output2, `(okay) 'wat'`);

  t.end();
});

// Skipped: engine262 tests
// test.skip('engine262 works', async (t) => { ... });

maybeTest('deno works', async (t) => {
  const output = await testEval('d> 2+2');
  t.equal(output, '(okay) 4');

  t.end();
});

maybeTest('deno outputs console.warn', async (t) => {
  const output = await testEval('d> console.warn("test")');
  t.equal(output, '(okay) test');

  t.end();
});

maybeTest('deno errors when it should', async (t) => {
  const output = await testEval('d> 2++2');
  t.equal(
    output,
    `(fail) error: The module's source code could not be parsed: Expected ';', got 'numeric literal (2, 2)'. 2++2 ~`,
  );

  const output2 = await testEval('d> throw 2');
  t.equal(output2, '(okay) 2');

  const output3 = await testEval('d> throw new TypeError(2)');
  t.equal(output3, '(okay) TypeError: 2');

  t.end();
});

maybeTest('deno replies to user', async (t) => {
  const output = await testEval(`d>'ok'`, { mentionUser: 'jay' });
  t.equal(output, `jay, ok`);

  t.end();
});

maybeTest('deno handles empty input', async (t) => {
  const output = await testEval(`d>  `);
  t.equal(output, '(okay) (empty)');

  t.end();
});

maybeTest('deno correctly returns last expression', async (t) => {
  const output = await testEval('d> let x:string = "hello world";x');
  t.equal(output, '(okay) hello world');

  t.end();
});
