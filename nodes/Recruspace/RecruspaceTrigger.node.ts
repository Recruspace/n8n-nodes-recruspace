import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

export class RecruspaceTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Recruspace Webhook Trigger',
		name: 'recruspaceTrigger',
		icon: 'file:recruspace.svg',
		group: ['trigger'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Receives real-time events from Recruspace ATS',
		defaults: {
			name: 'Recruspace Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'recruspaceApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'recruspace-event',
			},
		],
		properties: [
			{
				displayName: 'Events to Listen',
				name: 'events',
				type: 'multiOptions',
				options: [
					{
						name: 'Candidate Applied',
						value: 'candidate_applied',
					},
					{
						name: 'Candidate Replied to Email',
						value: 'candidate_replied_to_email',
					},
				],
				default: ['candidate_applied'],
				required: true,
				description: 'Select the events from Recruspace to trigger this workflow',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('recruspaceApi');
				const baseUrl = (credentials.baseUrl as string) || 'http://localhost:5000';
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];
				const cleanBaseUrl = baseUrl.replace(/\/$/, '');
				await this.helpers.httpRequest({
					method: 'POST',
					url: `${cleanBaseUrl}/subscribe`,
					headers: {
						'x-api-key': credentials.apiKey as string,
						'Content-Type': 'application/json',
					},
					body: {
						target_url: webhookUrl,
						events,
					},
					json: true,
				});
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('recruspaceApi');
				const baseUrl = (credentials.baseUrl as string) || 'http://localhost:5000';
				const webhookUrl = this.getNodeWebhookUrl('default');
				const cleanBaseUrl = baseUrl.replace(/\/$/, '');
				await this.helpers.httpRequest({
					method: 'DELETE',
					url: `${cleanBaseUrl}/subscribe`,
					headers: {
						'x-api-key': credentials.apiKey as string,
						'Content-Type': 'application/json',
					},
					body: {
						target_url: webhookUrl,
					},
					json: true,
				});
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getRequestObject().body;
		return {
			workflowData: [
				[
					{
						json: bodyData,
					},
				],
			],
		};
	}
}

