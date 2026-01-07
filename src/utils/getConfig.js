'use strict';

const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');

let absoluteFilePath;

if (process.env.JELLOBOT_CONFIG) {
	absoluteFilePath = path.resolve(process.cwd(), process.env.JELLOBOT_CONFIG);
} else {
	const filename = 'jellobot-config.json';
	absoluteFilePath = `${process.cwd()}/${filename}`;
}

const randomNick = `jellobot-${Math.floor(Math.random() * 1e5)}`;
const defaultServer = {
	channels: [{ name: '##jellobot-test' }],
	commandPrefix: '!',
	debug: false,
	nick: randomNick,
	password: null,
	sasl: false,
	secure: false,
	server: 'irc.libera.chat',
};

const defaultConfig = {
	plugins: {
		jsEval: {
			timeout: 5000,
		},
	},
};

const toMultiServer = (config) => {
	const {
		plugins, ...rest
	} = config;
	let { servers } = config;

	if (!Array.isArray(servers)) {
		servers = [rest];
	}

	servers = servers.map((server) => ({
		...defaultServer,
		...server,
	}));

	return { plugins, servers };
};

exports.processConfig = (customConfig) => {
	const config = toMultiServer({ ...defaultConfig, ...customConfig });

	for (const server of config.servers) {
		// generate the config passed to new irc.Client
		server.ircClientConfig = {
			channels: server.channels
				.filter((x) => !x.requiresAuth)
				.map(({ name }) => name),
			// retryCount: 10,
		};

		if (server.password) {
			server.ircClientConfig.userName = server.userName || server.nick;
			server.ircClientConfig.password = server.password;
			server.ircClientConfig.port = server.port || 6667;
		}

		if (server.sasl) {
			server.ircClientConfig.sasl = true;
		}
		if (server.sasl || server.secure) {
			server.ircClientConfig.secure = true;
		}
		if (server.debug) {
			server.ircClientConfig.debug = true;
		}

		server.ircClientConfig.realName = server.realName || config.realName || 'jellobot';
	}

	// parse args
	const argv = process.argv.slice(2);
	config.verbose = config.verbose || argv.indexOf('-v') !== -1;

	return config;
};

exports.readAndProcessConfig = () => {
	let rawConfigFile;
	try {
		rawConfigFile = fs.readFileSync(absoluteFilePath, 'utf-8');
	} catch (e) { // eslint-disable-line no-unused-vars
		console.error(`FATAL: Couldn't read ${absoluteFilePath}`);
		process.exit(7);
	}

	let customConfig;
	try {
		customConfig = JSON5.parse(rawConfigFile);
	} catch (e) {
		console.error(e);
		console.error(`FATAL: ${absoluteFilePath} is invalid json`);
		process.exit(7);
	}

	return exports.processConfig(customConfig);
};
