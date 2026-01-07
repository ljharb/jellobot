'use strict';

const fs = require('fs');
const glob = require('glob');
const cp = require('child_process');
const assert = require('assert');
const SshConnection = require('./sshUtils');

const user = process.argv[2];
const host = process.argv[3];

assert(user, 'User ($1) must be provided');
assert(host, 'Host ($2) must be provided');

const configFiles = [
	process.env.JELLOBOT_CONFIG,
	'jellobot-config.prod.json',
	'jellobot-config.production.json',
	'jellobot-config.json',
].filter(Boolean);
let configContent = null;

for (const file of configFiles) {
	try {
		configContent = fs.readFileSync(file, 'utf-8');
	} catch (e) { // eslint-disable-line no-unused-vars
		configContent = null;
	}
	if (configContent) {
		break;
	}
}

if (!configContent) {
	console.error(`Tried reading config files: ${configFiles.join(', ')} but none existed`);
	process.exit(7);
}

const pack = async function () {
	try {
		cp.execSync('rm *.tgz');
	} catch (e) { // eslint-disable-line no-unused-vars
		// do nothing
	}

	cp.execSync('npm pack');

	const file = glob.sync('*.tgz').shift();
	return file;
};

const getPackageJson = function () {
	const packageJson = JSON.parse(fs.readFileSync('package.json'));
	packageJson.devDependencies = {};
	return packageJson;
};

const run = async function () {
	const log = {
		debug: console.error,
		flags: { debug: true, verbose: true },
		info: console.error,
		verbose: console.error,
	};
	const ssh = new SshConnection({
		host,
		log,
		user,
	});

	const nvmExec = function (command) {
		return ssh.exec(`source ~/.nvm/nvm.sh; nvm install node --latest-npm && ${command}`);
	};

	try {
		await ssh.connect();
		const tgzPath = await pack();

		const ftp = await ssh.ftp();

		const tempFilePath = '/tmp/jellobot.tgz';
		await ftp.writeFileAsync(tempFilePath, fs.readFileSync(tgzPath));

		const dir = '/home/jellobot/bot1';
		await ssh.exec(`mkdir -p ${dir}`);

		await ssh.exec(`cd ${dir} && tar --strip-components 1 -xzf ${tempFilePath}`);

		await ftp.writeFileAsync(
			`${dir}/package.json`,
			JSON.stringify(getPackageJson(), null, 2),
		);
		await ftp.writeFileAsync(`${dir}/jellobot-config.json`, configContent);

		await nvmExec(`(which pm2 || npm install -g pm2@5); cd ${dir}; npm install`);

		await ssh.exec(`printf "${new Date().toISOString()}" > /tmp/jellobot-updated-at`);

		if (process.argv.includes('--restart')) {
			console.error('Restarting the bot');
			try {
				await nvmExec(`cd ${dir}; pwd; env NODE_ENV=production pm2 restart jellobot1 --watch=${dir}`);
			} catch (e) { // eslint-disable-line no-unused-vars
				// eslint-disable-next-line max-len
				await nvmExec(`cd ${dir}; pwd; env NODE_ENV=production pm2 start --name jellobot1 src/bot.js --watch=${dir}`);
			}
		} else {
			console.error('Run with --restart to restart the bot.');
		}

		await nvmExec(`cd ${dir}; ./src/plugins/js-eval/init`); // build brigand/js-eval image
	} finally {
		ssh.end().catch(() => {});
	}
};

run().catch((e) => {
	console.error('Fatal error');
	console.error(e);
	process.exit(7);
});
