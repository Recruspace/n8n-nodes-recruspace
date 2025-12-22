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
			baseURL: 'https://n8n.api.recruspace.com',
			url: '/auth/validate',
			method: 'GET',
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};
}
