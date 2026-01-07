'use strict';

const babelTraverse = require('@babel/traverse').default;

/**
 *
 * @param {Object} root AST
 * @return {Object} ast
 */
module.exports = function processTopLevelAwait(root) {
	let containsAwait = false;
	let containsReturn = false;

	babelTraverse(root, {
		enter(path) {
			switch (path.type) {
				case 'FunctionDeclaration':
				case 'FunctionExpression':
				case 'ArrowFunctionExpression':
				case 'MethodDefinition':
				case 'ClassMethod':
					// stop when entering a new function scope:
					return path.skip();

				case 'ForOfStatement':
					if (path.node.await === true) {
						containsAwait = true;
					}
					break;
				case 'AwaitExpression':
					containsAwait = true;
					break;
				case 'ReturnStatement':
					containsReturn = true;
					break;
				default:
					break;
			}
			return undefined;
		},
	});

	/*
	 * Do not transform if
	 * 1. False alarm: there isn't actually an await expression.
	 * 2. There is a top-level return, which is not allowed.
	 */
	if (!containsAwait || containsReturn) {
		return root;
	}

	const last = root.program.body[root.program.body.length - 1];

	// replace last node with a returnStatement of this node, if the last node is an expression
	if (last.type === 'ExpressionStatement') {
		// eslint-disable-next-line no-param-reassign
		root.program.body[root.program.body.length - 1] = {
			argument: last.expression,
			type: 'ReturnStatement',
		};
	}

	/* eslint-disable sort-keys */
	const iiafe = {
		type: 'Program',
		sourceType: 'script',
		body: [
			{
				type: 'ExpressionStatement',
				expression: {
					type: 'CallExpression',
					callee: {
						type: 'ArrowFunctionExpression',
						async: true,
						params: [],
						body: {
							type: 'BlockStatement',
							body: root.program.body,
						},
					},
					arguments: [],
				},
			},
		],
	};
	/* eslint-enable sort-keys */
	// const iiafe = t.program([t.expressionStatement(t.callExpression(t.arrowFunctionExpression([], t.blockStatement(root.program.body)), []))]) // with @babel/types

	return iiafe;
};
