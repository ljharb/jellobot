'use strict';

/* eslint global-require: "off" */

module.exports = function () {
	return {
		ciu: require('./ciu/ciuPlugin'),
		factoid: require('./factoids/factoidsPlugin'),
		jsEval: require('./js-eval/jsEvalPlugin'),
		mdn: require('./mdn/mdnPlugin'),
		npm: require('./npm/npmPlugin'),
		repaste: require('./repaste/repastePlugin'),
		rng: require('./rng/rngPlugin'),
	};
};
