'use strict';

const cp = require('child_process');
const crypto = require('crypto');
const babel = require('@babel/core');
const babelGenerator = require('@babel/generator').default;
const babelParser = require('@babel/parser');
const exec = require('../../utils/exec');
const processTopLevelAwait = require('./processTopLevelAwait');
const { parserPlugins, transformPlugins } = require('./babelPlugins');

const helpMsg = 'n> node stable, b> babel, s> node vm.Script, m> node vm.SourceTextModule, e> engine262, d> deno, t> node-ts, tm> node-mts';

const timeoutMs = process.env.JSEVAL_TIMEOUT_MS
	? parseInt(process.env.JSEVAL_TIMEOUT_MS, 10)
	: 5000;
const envs = {
	b: 'node-cjs',
	d: 'deno',
	e: 'engine262',
	m: 'module',
	n: 'node-cjs',
	s: 'script',
	t: 'node-ts',
	tm: 'node-mts',
};

module.exports = async function jsEvalPlugin({
	mentionUser,
	respond,
	message,
	dockerCmd = 'docker',
	runFilePath = '/run/run.js',
	selfConfig = {},
}) {
	const effectiveTimeout = selfConfig.timer || timeoutMs;
	const mode = message[0];

	if (message[1] !== '>') {
		return;
	}

	if (mode === '?') {
		respond((mentionUser ? `${mentionUser}, ` : '') + helpMsg);
		return;
	}

	if (!envs[mode]) {
		return;
	}

	let code = message.slice(2);

	const hasMaybeTLA = (/\bawait\b/).test(code);

	if (mode === 'b' || hasMaybeTLA) {
		// there's maybe a TLA await
		let ast = babelParser.parse(code, {
			allowAwaitOutsideFunction: true,
			...mode === 'b' && { plugins: parserPlugins },
		});

		if (hasMaybeTLA) {
			ast = processTopLevelAwait(ast);
		}

		if (mode === 'b') {
			code = await babel
				.transformFromAstAsync(ast, code, {
					plugins: transformPlugins,
				})
				.then((r) => r.code);
		} else {
			({ code } = babelGenerator(ast));
		}
	}

	const name = `jseval-${crypto.randomBytes(8).toString('hex')}`;

	try {
		const args = [
			'run',
			'--platform=linux/amd64',
			'-i',
			'--rm',
			`--name=${name}`,
			'--net=none',
			'--pids-limit=50',
			`-eJSEVAL_MODE=${mode}`,
			`-eJSEVAL_ENV=${envs[mode]}`,
			`-eJSEVAL_TIMEOUT=${effectiveTimeout}`,
			'brigand/js-eval',
			'node',
			'--experimental-vm-modules', // used by m>
			'--experimental-modules',
			'--no-warnings',
			runFilePath,
		];

		const data = await exec(dockerCmd, args, {
			stdin: code,
			timeout: effectiveTimeout,
		});

		const clean = data
			// eslint-disable-next-line prefer-named-capture-group
			.replace(/(\S)\s*⬊ (?:undefined|null)$/, '$1')
			.replace(/⬊\s*/, '')
			.trim();

		respond((mentionUser ? `${mentionUser}, ` : '(okay) ') + clean);
	} catch (e) {
		if (e.name === 'TimeoutError') {
			cp.execSync(`${dockerCmd} kill --signal=9 ${name}`);
		}

		const clean = e.message.replace(/⬊\s*/, '').trim();
		const reason = e.name === 'TimeoutError' ? 'timeout' : 'fail';

		respond((mentionUser ? `${mentionUser}, ` : `(${reason}) `) + clean); // Error message always start with Error:
	}
};

if (process.env.NODE_ENV !== 'test') {
	process.on('exit', () => {
		const cmd = 'docker rm -f $(docker ps -qf name=jseval)';
		cp.exec(cmd, (err, stdout) => {
			console.error(`Command '${cmd}' finished with output`);
			console.error(stdout);
			console.error(`End of '${cmd}' output`);
		});
	});
}
