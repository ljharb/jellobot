'use strict';

const test = require('tape');
const npmPlugin = require('./npmPlugin');

const testNpm = async function (message) {
	return new Promise((resolve) => {
		npmPlugin({
			command: { command: message },
			handling() { /* empty */ },
			respondWithMention: resolve,
		});
	});
};

test('works', async (t) => {
	const output = await testNpm('npm bootstrap');

	const [beforeSpace, afterSpace] = output.split(' ');
	t.equal(beforeSpace, 'npm.im/bootstrap');
	t.match(afterSpace.split('|')[0], /^\d+\.\d+\.\d+/);
	t.match(afterSpace.split('|')[1], /^\d{4}-\d{2}-\d{2}$/);
	t.end();
});

test('works for searches', async (t) => {
	const output = await testNpm('npm ?bootstrap');

	const results = output.split(' ⸺ ');
	t.ok(results.length > 2, 'has more than 2 results');

	const [beforeSpace, afterSpace] = results[0].split(' ');
	t.equal(beforeSpace, 'npm.im/bootstrap');
	t.match(afterSpace.split('|')[0], /^\d+\.\d+\.\d+/);
	t.match(afterSpace.split('|')[1], /^\d{4}-\d{2}-\d{2}$/);
	t.end();
});

test('pre-validates against invalid package names', async (t) => {
	const output = await testNpm('npm %wot');

	t.equal(output, "that doesn't look like a valid package specifier");
	t.end();
});
