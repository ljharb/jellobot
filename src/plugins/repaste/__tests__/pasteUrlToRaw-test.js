'use strict';

const test = require('tape');
const pasteUrlToRaw = require('../pasteUrlToRaw');

test('bpaste', (t) => {
	t.deepEqual(pasteUrlToRaw('https://bpaste.net/show/4463220a2c07'), {
		js: 'https://bpaste.net/raw/4463220a2c07',
	});
	t.deepEqual(pasteUrlToRaw('https://bpaste.net/raw/4463220a2c07'), {
		js: 'https://bpaste.net/raw/4463220a2c07',
	});
	t.end();
});

test('pastebin', (t) => {
	t.deepEqual(pasteUrlToRaw('http://pastebin.com/iydu8g2t'), {
		js: 'https://pastebin.com/raw/iydu8g2t',
	});
	t.deepEqual(pasteUrlToRaw('http://pastebin.com/raw/iydu8g2t'), {
		js: 'https://pastebin.com/raw/iydu8g2t',
	});
	t.end();
});

test('dpaste', (t) => {
	t.deepEqual(pasteUrlToRaw('http://dpaste.com/3XB47RJ'), {
		js: 'http://dpaste.com/3XB47RJ.txt',
	});
	t.deepEqual(pasteUrlToRaw('http://dpaste.com/3XB47RJ.txt'), {
		js: 'http://dpaste.com/3XB47RJ.txt',
	});
	t.end();
});

test('codepen', (t) => {
	t.deepEqual(pasteUrlToRaw('https://codepen.io/brigand/pen/JERLwv'), {
		js: 'https://codepen.io/brigand/pen/JERLwv.js',
		css: 'https://codepen.io/brigand/pen/JERLwv.css',
		html: 'https://codepen.io/brigand/pen/JERLwv.html',
	});
	t.end();
});
