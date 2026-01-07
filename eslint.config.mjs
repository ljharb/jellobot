import ljharb from '@ljharb/eslint-config/flat';
import ljharbNode from '@ljharb/eslint-config/flat/node/14';
import ljharbTests from '@ljharb/eslint-config/flat/tests';
import importPlugin from 'eslint-plugin-import';

export default [
	...ljharb,
	...ljharbNode,
	{
		files: ['scripts/convert-factoids'],
		rules: {
			'func-style': 'off',
		},
	},
	{
		plugins: {
			import: importPlugin,
		},
		rules: {
			'import/no-extraneous-dependencies': [
				'error',
				{
					devDependencies: [
						'eslint.config.mjs',
						'**/__tests__/**',
						'**/*.test.js',
						'**/*-test.js',
						'scripts/**',
					],
				},
			],
			'max-len': ['warn', 120],
			'max-lines-per-function': 'warn',
			'max-nested-callbacks': 'warn',
			'max-params': 'warn',
			'max-statements': 'warn',
			'no-console': [
				'error',
				{
					allow: [
						'debug', 'warn', 'error', 'log',
					],
				},
			],
			'no-restricted-syntax': [
				'error',
				{
					message: 'Debugger statements are not allowed',
					selector: 'DebuggerStatement',
				},
				{
					message: 'Labeled statements are not allowed',
					selector: 'LabeledStatement',
				},
				{
					message: 'With statements are not allowed',
					selector: 'WithStatement',
				},
			],
		},
	},
	{
		files: ['scripts/**'],
		rules: {
			'no-underscore-dangle': 'warn',
		},
	},
	{
		files: ['src/plugins/js-eval/run.js'],
		rules: {
			'func-name-matching': 'off',
			'func-style': 'off',
			'new-cap': 'off',
			'no-negated-condition': 'off',
		},
	},
	...ljharbTests.map((config) => ({
		...config,
		files: [
			'**/__tests__/**', '**/*.test.js', '**/*-test.js',
		],
	})),
];
