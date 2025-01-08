const { Script, SourceTextModule, createContext } = require('vm');
const util = require('util');
const Module = require('module');

const builtinModules = Module.builtinModules.filter((s) => !/^_|\//.test(s));
const { setTimeout } = require('timers/promises');

// code taken from https://github.com/devsnek/docker-js-eval/run.js

const inspect = (val) => {
  try {
    return util.inspect(val, {
      maxArrayLength: 20,
      breakLength: Infinity,
      colors: false,
      compact: true,
      depth: 10,
    });
  } catch {
    return '';
  }
};

function exposeBuiltinInGlobal(name) {
  const setReal = (val) => {
    delete global[name];
    global[name] = val;
  };
  Object.defineProperty(global, name, {
    get: () => {
      const value = require(name); // eslint-disable-line
      if (name === 'timers') {
        value.promises = value.promises || require('timers/promises'); // eslint-disable-line
      }
      delete global[name];
      Object.defineProperty(global, name, {
        get: () => value,
        set: setReal,
        configurable: true,
        enumerable: false,
      });
      return value;
    },
    set: setReal,
    configurable: true,
    enumerable: false,
  });
}

async function run(code, environment, timeout) {
  switch (environment) {
    case 'node-ts':
      code = Module.stripTypeScriptTypes(code); // eslint-disable-line no-param-reassign
    // intentional fallthrough
    case 'node-cjs': {
      if (process.env.JSEVAL_MODE === 'b') {
        /* eslint global-require: 1 */
        require('@bloomberg/record-tuple-polyfill');
        require('airbnb-js-shims');
        require('array.prototype.at/auto');
        require('array.prototype.flat/auto');
        require('array.prototype.flatmap/auto');
        require('array.prototype.toreversed/auto');
        require('array.prototype.tosorted/auto');
        require('array.prototype.tospliced/auto');
        require('array.prototype.with/auto');
        require('arraybuffer.prototype.detached/auto');
        require('disposablestack/auto');
        require('es-iterator-helpers/auto');

        require('es-map/auto');
        require('map.groupby/auto');

        require('es-set/auto');
        require('set.prototype.difference/auto');
        require('set.prototype.intersection/auto');
        require('set.prototype.isdisjointfrom/auto');
        require('set.prototype.issubsetof/auto');
        require('set.prototype.issupersetof/auto');
        require('set.prototype.symmetricdifference/auto');
        require('set.prototype.union/auto');
        require('math.sumprecise/auto');
        require('object.groupby/auto');

        require('promise.prototype.finally/auto');
        require('promise.try/auto');

        require('regexp.escape/auto');
        require('string.prototype.at/auto');
        require('suppressed-error/auto');
      }
      const script = new Script(code);
      global.module = module;
      global.require = require;
      global.exports = exports;
      global.__dirname = __dirname; // eslint-disable-line no-underscore-dangle
      global.__filename = __filename; // eslint-disable-line no-underscore-dangle
      builtinModules.forEach(exposeBuiltinInGlobal);
      const result = await script.runInThisContext({
        timeout,
        displayErrors: true,
      });
      return inspect(result);
    }

    case 'node-mts':
      code = Module.stripTypeScriptTypes(code); // eslint-disable-line no-param-reassign
    // intentional fallthrough
    case 'module': {
      const module = new SourceTextModule(code, {
        context: createContext(Object.create(null)),
      });
      await module.link(async () => {
        throw new Error('Unable to resolve import');
      });

      const timeoutCtrl = new AbortController();
      const result = await Promise.race([
        module.evaluate({ timeout }).finally(() => timeoutCtrl.abort()),
        setTimeout(Math.floor(timeout * 1.5), timeoutCtrl).then(() => {
          throw new Error('The execution timed out');
        }),
      ]);

      return inspect(result);
    }

    case 'script': {
      const script = new Script(code, {
        displayErrors: true,
      });
      const result = await script.runInContext(createContext(Object.create(null)), {
        timeout,
        displayErrors: true,
      });
      return inspect(result);
    }

    case 'engine262': {
      const {
        Agent,
        ManagedRealm,
        Value,
        CreateDataProperty,
        FEATURES,
        setSurroundingAgent,
        inspect: _inspect,
      } = require('engine262'); // eslint-disable-line

      const agent = new Agent({
        features: FEATURES.map((o) => o.name),
      });
      setSurroundingAgent(agent);

      const realm = new ManagedRealm();

      return new Promise((resolve, reject) => {
        realm.scope(() => {
          const print = new Value((args) => {
            console.log(...args.map((tmp) => _inspect(tmp)));
            return Value.undefined;
          });
          CreateDataProperty(realm.GlobalObject, new Value('print'), print);

          const completion = realm.evaluateScript(code);
          if (completion.Type === 'throw') {
            reject(_inspect(completion.Value));
          } else {
            resolve(_inspect(completion.Value));
          }
        });
      });
    }

    case 'deno': {
      const cp = require('child_process');

      // copied verbatim from src/utils/exec.js
      // TODO: shared utils with Docker container?
      const exec = function exec(cmd, args, { env, stdin, timeout: timeout2 } = {}) {
        let data = '';

        const dataPromise = new Promise((resolve, reject) => {
          const proc = cp.spawn(cmd, args, { env });

          if (stdin) {
            proc.stdin.write(stdin);
            proc.stdin.end();
          }

          proc.stdout.on('data', (chunk) => {
            data += chunk;
          });

          proc.stderr.on('data', (chunk) => {
            data += chunk;
          });

          proc.on('error', reject);

          proc.on('exit', (status) => {
            if (status !== 0) {
              reject(Object.assign(new Error(data), { status }));
            } else {
              resolve(data.trim());
            }
          });
        });

        if (timeout2) {
          let timer;

          return Promise.race([
            dataPromise.finally(() => clearTimeout(timer)),
            new Promise((resolve) => {
              timer = global.setTimeout(resolve, timeout);
            }).then(() => {
              throw Object.assign(new Error(data), { name: 'TimeoutError' }); // send data received so far in the error msg
            }),
          ]);
        }

        return dataPromise;
      };

      // Prepare exec output and possible error.
      let out;
      let errored = false;

      // A very naive function to return the last expression
      // in multiline semicolon-separated code.
      const returnLastExpression = function returnLastExpression(code2) {
        const exprs = code2.split(';');
        const last = exprs.pop();
        return [exprs, `return ${last}`].join(';');
      };

      // Deno evals code at expression position, wrapped in a console.log(<code here>).
      // If we receive a statement, or code with multiple semicolon seperated expressions,
      // we need to wrap it in an expression and also return the last expression of that code.
      // We use an IIFE to achieve that, and try various ways to express the code,
      // and we return the one that succeeds.
      //
      // TODO:
      // - run all of them and somehow rank the results by the most likely to be correct,
      //   using some heuristic.
      // - differentiate between errors and successful responses. Currently all are
      //   reported as (okay) unless the actual spawn fails.
      //   (differentiate also between cli failure and script exceptions?)
      const attempts = [
        code,
        `(() => { try { ${code} } catch (e) { return e } })()`,
        `(() => { try { ${returnLastExpression(code)} } catch (e) { return e } })()`,
      ];
      let attempt;

      /* eslint no-cond-assign: 0 */
      while ((attempt = attempts.shift())) {
        try {
          /* eslint no-await-in-loop: 0 */
          out = await exec(
            'deno',
            [
              'eval',

              '--print', // Print result to stdout
              '--ext',
              'ts', // Treat code input as a .ts file

              '--no-remote', // Do not resolve remote modules
              '--no-npm', // Do not resolve npm modules

              '--no-config', // Disable automatic loading of the configuration file
              '--no-lock', // Disable auto discovery of the lock file

              // Enable unstable features and APIs
              '--unstable-broadcast-channel',
              '--unstable-cron',
              '--unstable-kv',
              '--unstable-temporal',
              '--unstable-unsafe-proto',
              '--unstable-webgpu',
              '--unstable-worker-options',

              attempt,
            ],
            {
              env: {
                // We pass current env otherwise PATH is empty
                // and deno command isn't found (ENOENT)
                ...process.env,
                NO_COLOR: true, // Tell deno to not color its output
              },
              timeout,
            },
          );
          if (out === 'undefined') throw out;
          errored = false;
          break;
        } catch (error) {
          errored = true;
          out = error.message;
        }
      }

      out = out || '(empty)';

      // --print will return a \nundefined when the value is consumed by a manual console print, so we remove it
      out = out.replace('\nundefined', '');

      // don't leak file system details
      out = out.replace(/at file:.*$/gm, '');

      // remove trailing spaces on each line
      out = out.replace(/\s+$/gm, '');

      // replace newlines with full stops
      out = out.replace(/\n/, '. ');

      // remove extra spaces
      out = out.replace(/\s{1,}/g, ' ');

      // remove our wrappers from the output
      out = out
        .replace('console.log((() => { try { ;', '')
        .replace(' } catch (e) { return e } })())', '')
        .replace('return ', '');

      if (errored) throw out;

      return out;
    }

    default:
      throw new RangeError(`Invalid environment: ${environment}`);
  }
}

if (require.main === module) {
  (async () => {
    let code = process.argv[2];
    if (!code) {
      // if no argument, read from stdin
      code = '';
      for await (const chunk of process.stdin) {
        code += chunk;
      }
    }
    try {
      const output = await run(
        code,
        process.env.JSEVAL_ENV,
        Number.parseInt(process.env.JSEVAL_TIMEOUT, 10) || undefined,
      );
      process.stdout.write('⬊ ');
      process.stdout.write(output);
    } catch (error) {
      process.stdout.write(
        error instanceof Error ? `${error.name}: ${error.message}` : `${error}`,
      );
      process.exit(1);
    }
  })();
}
