const cp = require('child_process');

// better version of util.promisify(child_process.exec) that throws when exit code is not success (0)
module.exports = function exec(cmd, args, { stdin, timeout } = {}) {
  let data = '';

  const dataPromise = new Promise((resolve, reject) => {
    const proc = cp.spawn(cmd, args);

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

  if (timeout) {
    let timer;

    return Promise.race([
      dataPromise.finally(() => clearTimeout(timer)),
      new Promise((resolve) => {
        timer = setTimeout(resolve, timeout);
      }).then(() => {
        throw Object.assign(new Error(data), { name: 'TimeoutError' }); // send data received so far in the error msg
      }),
    ]);
  }

  return dataPromise;
};
