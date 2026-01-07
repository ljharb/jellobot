'use strict';

const test = require('tape');
const fs = require('fs');
const path = require('path');
const parseJsfiddle = require('../parseJsfiddle');

test('parses', (t) => {
	const fixtureHtml = fs.readFileSync(
		path.join(__dirname, '../jsfiddle-example.html'),
		'utf-8',
	);
	const res = parseJsfiddle(fixtureHtml);
	t.deepEqual(res, {
		js: 'var a = {test: \'js\'};',
		html: '<b>test html</b>',
		css: '.test-css {}',
	});
	t.end();
});
