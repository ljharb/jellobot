'use strict';

const test = require('tape');
const { processConfig } = require('../getConfig');

test('works', (t) => {
	const config = processConfig({ nick: 'jellobot' });
	t.ok(Array.isArray(config.servers), 'servers is an array');
	t.equal(config.servers.length, 1, 'has one server');
	t.equal(config.servers[0].nick, 'jellobot', 'server has correct nick');
	t.end();
});

test('handles missing servers array', (t) => {
	const config = processConfig({ nick: 'jellobot' });
	t.equal(config.nick, undefined, 'top-level nick is undefined');
	t.ok(Array.isArray(config.servers), 'servers is an array');
	t.equal(config.servers[0].nick, 'jellobot', 'server has correct nick');
	t.end();
});

test('handles servers array', (t) => {
	const config = processConfig({ servers: [{ nick: 'jellobot' }] });
	t.equal(config.nick, undefined, 'top-level nick is undefined');
	t.ok(Array.isArray(config.servers), 'servers is an array');
	t.equal(config.servers[0].nick, 'jellobot', 'server has correct nick');
	t.end();
});
