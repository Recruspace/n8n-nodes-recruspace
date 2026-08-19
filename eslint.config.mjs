import { config } from '@n8n/node-cli/eslint';

// The overrides field is required here: it pins patched versions of transitive
// dependencies (uuid, undici, ignore) that upstream packages still resolve to
// vulnerable versions, and keeps npm ci's lockfile validation consistent.
export default [
	...config,
	{
		rules: {
			'@n8n/community-nodes/no-overrides-field': 'off',
		},
	},
];
