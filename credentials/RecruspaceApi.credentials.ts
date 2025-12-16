import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class RecruspaceApi implements ICredentialType {
	name = 'recruspaceApi';

	displayName = 'Recruspace API';
	icon = 'file:recruspace.svg' as Icon;

	documentationUrl = 'https://github.com/org/-recruspace?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'https://dev.api.recruspace.com/',
			description: 'The base URL of your Recruspace API instance',
			placeholder: 'https://dev.api.recruspace.com/',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/v1/integrations/api-keys/validate/',
		},
	};
}
