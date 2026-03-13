import type {
	IDataObject,
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type RecruspaceTriggerAuthRequestHelper = (
	this: IHookFunctions,
	credentialType: string,
	requestOptions: IDataObject,
) => Promise<unknown>;

async function httpRequestWithRecruspaceAuth(
	context: IHookFunctions,
	requestOptions: IDataObject,
): Promise<unknown> {
	const helpers = context.helpers as unknown as {
		httpRequestWithAuthentication?: RecruspaceTriggerAuthRequestHelper;
		requestWithAuthentication?: RecruspaceTriggerAuthRequestHelper;
	};

	const requestWithAuth =
		helpers.httpRequestWithAuthentication ?? helpers['requestWithAuthentication'];

	if (!requestWithAuth) {
		throw new NodeOperationError(
			context.getNode(),
			'This n8n version does not support authenticated HTTP helper requests. Please upgrade n8n.',
		);
	}

	return await requestWithAuth.call(context, 'recruspaceApi', requestOptions);
}

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
						name: 'Bulk Import Completed',
						value: 'bulk_import_completed',
						description: 'Triggers when a bulk import is completed',
					},
					{
						name: 'Candidate Applied',
						value: 'candidate_created',
						description: 'Triggers when a new candidate is added',
					},
					{
						name: 'Candidate Replied Email',
						value: 'candidate_replied_to_email',
						description: 'Triggers when a candidate replies to an email',
					},
					{
						name: 'Job Closed',
						value: 'job_closed',
						description: 'Triggers when a job post is closed',
					},
					{
						name: 'New Job Posted',
						value: 'new_job_posted',
						description: 'Triggers when a new job post goes live',
					},
					{
						name: 'Stage Changed',
						value: 'stage_changed',
						description: 'Triggers when a candidate stage is changed',
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
				const baseUrl = 'https://n8n.api.recruspace.com';
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const cleanBaseUrl = baseUrl.replace(/\/$/, '');

				// Subscribe to the selected event
				await httpRequestWithRecruspaceAuth(this, {
					method: 'POST',
					url: `${cleanBaseUrl}/subscribe?type=${event}`,
					headers: {
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
				const baseUrl = 'https://n8n.api.recruspace.com';
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const cleanBaseUrl = baseUrl.replace(/\/$/, '');

				// Unsubscribe from the selected event
				// Silently ignore errors - webhook may already be deleted or backend unavailable
				try {
					await httpRequestWithRecruspaceAuth(this, {
						method: 'DELETE',
						url: `${cleanBaseUrl}/subscribe?type=${event}`,
						headers: {
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
