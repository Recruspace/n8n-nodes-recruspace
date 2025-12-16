import type {
	IHookFunctions,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
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
						name: 'Candidate Created',
						value: 'candidate_created',
					},
					{
						name: 'Candidate Replied to Email',
						value: 'candidate_replied_to_email',
					},
				],
				default: ['candidate_created'],
				required: true,
				description: 'Select the events from Recruspace to trigger this workflow.',
			},
		],
	};

	// Webhook registration / deletion
	webhookMethods = {
		default: {
			// We don't track existing webhooks by ID on our side; always (re)create.
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return false;
			},

			// When workflow is activated
			async create(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('recruspaceApi');
				const baseUrl = (credentials.baseUrl as string) || 'https://dev.api.recruspace.com/';
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];

				await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/api/v1/integrations/webhooks/`,
					headers: {
						Authorization: `Bearer ${credentials.apiKey}`,
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

			// When workflow is deactivated
			async delete(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('recruspaceApi');
				const baseUrl = (credentials.baseUrl as string) || 'https://dev.api.recruspace.com/';
				const webhookUrl = this.getNodeWebhookUrl('default');

				await this.helpers.httpRequest({
					method: 'DELETE',
					url: `${baseUrl}/api/v1/integrations/webhooks/`,
					headers: {
						Authorization: `Bearer ${credentials.apiKey}`,
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

	// Handle incoming webhook
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getRequestObject().body as IDataObject;

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
