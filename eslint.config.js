import globals from 'globals';
import pluginJs from '@eslint/js';


export default [
	{
		languageOptions: { globals: globals.node },
		rules: {
			indent: ['error', 'tab'],
			'linebreak-style': ['error', 'unix'],
			quotes: ['error', 'single'],
			semi: ['error', 'always'],
			'no-unused-vars': [
				'error', 
				{ 'vars': 'all', 'args': 'after-used', 'ignoreRestSiblings': false }
			]
		}
	},
	pluginJs.configs.recommended,
];