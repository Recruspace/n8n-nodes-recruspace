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
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						// Backend type: candidate_created
						name: 'Candidate Added',
						value: 'candidate_created',
					},
					{
						// Backend type: candidate_replied
						name: 'Candidate Replied',
						value: 'candidate_replied',
					},
				],
				default: 'candidate_created',
				required: true,
				description: 'Select the event from Recruspace to trigger this workflow',
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
				const baseUrl = 'https://n8n.api.recruspace.com';
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const cleanBaseUrl = baseUrl.replace(/\/$/, '');

				// Subscribe to the selected event
				await this.helpers.httpRequest({
					method: 'POST',
					url: `${cleanBaseUrl}/subscribe?type=${event}`,
					headers: {
						'x-api-key': credentials.apiKey as string,
						'Content-Type': 'application/json',
					},
					body: {
						hookUrl: webhookUrl,
					},
					json: true,
				});
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('recruspaceApi');
				const baseUrl = 'https://n8n.api.recruspace.com';
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const cleanBaseUrl = baseUrl.replace(/\/$/, '');

				// Unsubscribe from the selected event
				// Silently ignore errors - webhook may already be deleted or backend unavailable
				try {
					await this.helpers.httpRequest({
						method: 'DELETE',
						url: `${cleanBaseUrl}/subscribe?type=${event}`,
						headers: {
							'x-api-key': credentials.apiKey as string,
							'Content-Type': 'application/json',
						},
						body: {
							hookUrl: webhookUrl,
						},
						json: true,
					});
				} catch {
					// Ignore delete errors - webhook cleanup is best-effort
				}
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

