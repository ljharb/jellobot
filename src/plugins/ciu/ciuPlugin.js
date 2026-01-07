'use strict';

const fs = require('fs');
const { messageToFactoid } = require('../factoids/factoidsPlugin');

/* eslint-disable sort-keys */
const AGENTS_TO_SHOW = {
	ie: 'IE',
	edge: 'Edge',
	firefox: 'FF',
	chrome: 'Chrome',
	opera: 'Opera',
	safari: 'Safari',
	ios_saf: 'iOS', // eslint-disable-line camelcase
	android: 'Android',
};
/* eslint-enable sort-keys */

const getVersions = function (agents, feature) {
	return Object.entries(AGENTS_TO_SHOW)
		.map(([agent, agentName]) => {
			// agents versions strings are sorted
			const versions = agents[agent].versions.filter(Boolean);
			const versionFull = versions.find((v) => v && !(/[nupac]/g).test(feature.stats[agent][v]));

			if (versionFull) {
				return `${agentName} ${versionFull}`;
			}

			const versionPartial = versions.find((v) => v && !(/[nu]/g).test(feature.stats[agent][v]));

			if (versionPartial) {
				return `${agentName} ${versionPartial}~`;
			}

			return null;
		})
		.filter(Boolean);
};

/*
 * return all permutations of xs items, including sub-permutations
 * e.g. perms([0,1]) -> [[0,1], [1,0], [1], [0]]
 */
const perms = function (xs) {
	if (xs.length === 1) {
		return [xs];
	}
	return xs.flatMap((x, i) => perms(xs.slice(0, i).concat(xs.slice(i + 1))).flatMap((vs) => [vs, [x, ...vs]]));
};

module.exports = async function ciuPlugin(msg) {
	if (!msg.command) {
		return;
	}

	const [cmd, ...search] = msg.command.command.split(' ');
	if (cmd !== 'ciu' || search.length === 0) {
		return;
	}

	const factoid = await messageToFactoid(msg);
	if (factoid) {
		return;
	}

	msg.handling();

	const dbPath = require.resolve('caniuse-db/data.json');
	const db = JSON.parse(await fs.promises.readFile(dbPath, 'utf8'));

	const terms = search.map((s) => s.toLowerCase());
	const combos = perms(terms).map((a) => a.join('-'));

	let featKey = combos.find((key) => db.data[key]);
	let otherKeys; // if no exact match, we'll show more possible matches

	if (!featKey) {
		const matches = Object.entries(db.data)
			.map(([key, feat]) => {
				const kws = feat.keywords.split(',');
				const title = feat.title.toLowerCase();
				const desc = feat.description.toLowerCase();

				const score = terms
					.flatMap((term) => {
						const [mul, value] = (/^[!-]/).test(term) ? [0, term.slice(1)] : [1, term];

						return [
							(key.split(value).length - 1) * 10,
							((feat.keywords.split(value).length - 1) / kws.length) * 10,
							title.split(value).length - 1,
							desc.split(value).length - 1,
						].map((v) => v * mul);
					})
					.reduce((a, b) => a + b);

				return score > 1 ? [key, score] : null;
			})
			.filter(Boolean)
			.sort((a, b) => b[1] - a[1]);

		featKey = matches[0] && matches[0][0];
		otherKeys = matches.length > 1 && matches.slice(1, 5).map((a) => a[0]);
	}

	if (featKey) {
		const feature = db.data[featKey];
		const versions = getVersions(db.agents, feature);
		const versionsStr = versions.length > 0 ? `(${versions.join(', ')})` : '';
		// round to 2 dec https://www.jacklmoore.com/notes/rounding-in-javascript/
		const totalSupport = Number((feature.usage_perc_y + (feature.usage_perc_a || 0)).toFixed(2));
		const seeOthers = otherKeys
			? `, see also ${otherKeys.map((k) => `https://caniuse.com/${k}`).join(', ')}`
			: '';

		msg.respondWithMention(`${feature.title} ${versionsStr} ${totalSupport}% https://caniuse.com/${featKey}${seeOthers}`);
		return;
	}

	msg.respondWithMention('Failed to look up feature');
};
