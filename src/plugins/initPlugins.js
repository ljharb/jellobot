'use strict';

const tryRequire = function (path) {
	try {
		// eslint-disable-next-line global-require
		return require(path);
	} catch (e) { // eslint-disable-line no-unused-vars
		return null;
	}
};

const tryInit = async function (dir) {
	const initImpl = tryRequire(`./${dir}/init.js`);

	if (!initImpl) {
		return;
	}

	try {
		await initImpl();
		console.error(`Plugin ${dir} initialized`);
	} catch (e) {
		throw new Error(`Failed to initialize plugins/${dir}`, { cause: e });
	}
};

const init = async function () {
	for (const dir of [
		'ciu', 'factoids', 'js-eval', 'mdn', 'npm', 'rng',
	]) {
		// eslint-disable-next-line no-await-in-loop
		await tryInit(dir);
	}
};

module.exports = init;
