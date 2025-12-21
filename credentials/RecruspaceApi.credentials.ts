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

	icon: Icon = 'file:../nodes/Recruspace/recruspace.svg';

	documentationUrl =
		'https://github.com/ATS-Recruspace/n8n-nodes-recruspace#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'http://localhost:5000',
			description: 'The base URL of your n8n middleware (default: http://localhost:5000)',
			placeholder: 'http://localhost:5000',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Recruspace API key',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/auth/test',
			method: 'POST',
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};
}

