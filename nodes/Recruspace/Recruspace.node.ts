import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodeListSearchResult,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type RecruspaceRequestContext = IExecuteFunctions | ILoadOptionsFunctions;

type RecruspaceAuthRequestHelper = (
	this: RecruspaceRequestContext,
	credentialType: string,
	requestOptions: IDataObject,
) => Promise<unknown>;

async function httpRequestWithRecruspaceAuth(
	context: RecruspaceRequestContext,
	requestOptions: IDataObject,
): Promise<unknown> {
	const helpers = context.helpers as unknown as {
		httpRequestWithAuthentication?: RecruspaceAuthRequestHelper;
		requestWithAuthentication?: RecruspaceAuthRequestHelper;
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

export class Recruspace implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Recruspace',
		name: 'recruspace',
		icon: 'file:recruspace.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Recruspace',
		defaults: {
			name: 'Recruspace',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'recruspaceApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Candidate',
						value: 'candidate',
					},
					{
						name: 'Talent Pool',
						value: 'talentPool',
					},
				],
				default: 'candidate',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['candidate'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new candidate',
						action: 'Create candidate',
					},
					{
						name: 'Add Note',
						value: 'addNote',
						description: 'Add a note to an existing candidate',
						action: 'Add candidate note',
					},
					{
						name: 'Add Tag',
						value: 'addTag',
						description: 'Add a tag to an existing candidate',
						action: 'Add candidate tag',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search for a candidate by email',
						action: 'Search candidate',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['talentPool'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new talent pool',
						action: 'Create talent pool',
					},
				],
				default: 'create',
			},

			// --- Candidate: Create ---
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				required: true,
				default: '',
				description: 'The first name of the candidate',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				required: true,
				default: '',
				description: 'The last name of the candidate',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				required: true,
				default: '',
				description: 'The email of the candidate',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['create', 'search'],
					},
				},
			},
			{
				displayName: 'If Multiple Results Found',
				name: 'resultStrategy',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Return First Result',
						value: 'Select First',
						description: 'Return only the first matching candidate',
					},
					{
						name: 'Stop Execution',
						value: 'Select None',
						description: 'Return empty result if multiple candidates found',
					},
					{
						name: 'Return All Results',
						value: 'Select All',
						description: 'Return all matching candidates as separate items',
					},
				],
				default: 'Select First',
				description: 'How to handle when multiple candidates match the email',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'CV Source',
				name: 'cvSource',
				type: 'options',
				options: [
					{
						name: 'Binary Data',
						value: 'binaryData',
						description: 'Upload CV file directly from previous node binary data (multipart/form-data)',
					},
				],
				default: 'binaryData',
				description: 'Where to get the CV from (only binary data is supported for candidates)',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property containing the CV file',
				placeholder: 'data',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Associate With',
				name: 'associationType',
				type: 'options',
				options: [
					{
						name: 'Job Post',
						value: 'jobPost',
						description: 'Associate the candidate with a job post',
					},
					{
						name: 'Talent Pool',
						value: 'talentPool',
						description: 'Associate the candidate with a talent pool',
					},
				],
				default: 'jobPost',
				description: 'Where to associate the candidate',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Job Post',
				name: 'jobPost',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['create'],
						associationType: ['jobPost'],
					},
				},
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'getJobPosts',
							searchable: true,
						},
					},
					{
						displayName: 'By Hash',
						name: 'id',
						type: 'string',
						placeholder: '7f0d01fb1a4f4f7b8fd8bc2c33fe2665',
					},
				],
				description: 'Job post to associate with the candidate',
			},
			{
				displayName: 'Talent Pool',
				name: 'talentPoolId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['create'],
						associationType: ['talentPool'],
					},
				},
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'getTalentPools',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Must be a valid talent pool ID',
								},
							},
						],
						placeholder: '123',
					},
				],
				description: 'Talent pool to add the candidate to',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Phone Number',
						name: 'phone_number',
						type: 'string',
						default: '',
						description: 'Phone number of the candidate',
					},
				],
			},

			// --- Candidate: Add Note ---
			{
				displayName: 'Candidate ID',
				name: 'candidateId',
				type: 'number',
				required: true,
				default: 0,
				description: 'The ID of the candidate to add note to',
				placeholder: '12345',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['addNote'],
					},
				},
			},
			{
				displayName: 'Note Text',
				name: 'comment',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				required: true,
				default: '',
				description: 'The note text to add',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['addNote'],
					},
				},
			},

			// --- Candidate: Add Tag ---
			{
				displayName: 'Candidate ID',
				name: 'tagCandidateId',
				type: 'number',
				required: true,
				default: 0,
				description: 'The ID of the candidate to add tag to',
				placeholder: '12345',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['addTag'],
					},
				},
			},
			{
				displayName: 'Tag Title',
				name: 'tagTitle',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Important',
				description: 'The title of the tag to add',
				displayOptions: {
					show: {
						resource: ['candidate'],
						operation: ['addTag'],
					},
				},
			},

			// --- Talent Pool: Create ---
			{
				displayName: 'Name',
				name: 'talentPoolName',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Software Developer Talents',
				description: 'The name of the talent pool',
				displayOptions: {
					show: {
						resource: ['talentPool'],
						operation: ['create'],
					},
				},
			},
		],
	};

	methods = {
		listSearch: {
			async getTalentPools(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
				const baseUrl = 'https://n8n.api.recruspace.com';
				const cleanBaseUrl = baseUrl.replace(/\/$/, '');

				try {
					const response = await httpRequestWithRecruspaceAuth(this, {
						method: 'GET',
						url: `${cleanBaseUrl}/companies-talent-pools`,
						json: true,
					});

					const pools = (response as Array<{ id: number; name: string }>) || [];
					const results = pools.map((pool) => ({
						name: pool.name,
						value: pool.id.toString(),
					}));

					return { results };
				} catch {
					return { results: [] };
				}
			},
			async getJobPosts(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
				const baseUrl = 'https://n8n.api.recruspace.com';
				const cleanBaseUrl = baseUrl.replace(/\/$/, '');

				try {
					const response = await httpRequestWithRecruspaceAuth(this, {
						method: 'GET',
						url: `${cleanBaseUrl}/companies-job-posts`,
						json: true,
					});

					const jobs = (response as Array<{ title: string; hash: string }>) || [];
					const results = jobs.map((job) => ({
						name: job.title,
						value: job.hash,
					}));

					return { results };
				} catch {
					return { results: [] };
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const baseUrl = 'https://n8n.api.recruspace.com';

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const cleanBaseUrl = baseUrl.replace(/\/$/, '');

				if (resource === 'candidate') {
					if (operation === 'create') {
						const firstName = this.getNodeParameter('firstName', i) as string;
						const lastName = this.getNodeParameter('lastName', i) as string;
						const email = this.getNodeParameter('email', i) as string;
						const cvSource = this.getNodeParameter('cvSource', i) as string;
						const associationType = this.getNodeParameter('associationType', i) as string;

						// Only load the parameter that matches the association type
						let jobPost = '';
						let talentPoolId = 0;

						if (associationType === 'jobPost') {
							const jobPostParam = this.getNodeParameter('jobPost', i) as IDataObject;
							jobPost =
								typeof jobPostParam === 'object' && jobPostParam !== null
									? (jobPostParam.value as string)
									: (jobPostParam as string || '');
						} else if (associationType === 'talentPool') {
							const talentPoolIdParam = this.getNodeParameter(
								'talentPoolId',
								i,
							) as IDataObject;
							talentPoolId =
								typeof talentPoolIdParam === 'object' && talentPoolIdParam !== null
									? parseInt(String(talentPoolIdParam.value), 10)
									: parseInt(String(talentPoolIdParam || '0'), 10);
						}

						const additionalFields = this.getNodeParameter('additionalFields', i) as {
							phone_number?: string;
						};

						if (cvSource !== 'binaryData') {
							throw new NodeOperationError(
								this.getNode(),
								'Only "Binary Data" is supported as CV Source for creating candidates. Please provide CV as binary data from a previous node.',
								{ itemIndex: i },
							);
						}

						const associateWithJobPost = associationType === 'jobPost';
						const associateWithTalentPool = associationType === 'talentPool';

						if (associateWithJobPost) {
							if (!jobPost || jobPost.trim() === '') {
								throw new NodeOperationError(
									this.getNode(),
									'Job Post Hash is required when associating the candidate with a Job Post.',
									{ itemIndex: i },
								);
							}
						} else if (associateWithTalentPool) {
							if (!talentPoolId || talentPoolId <= 0) {
								throw new NodeOperationError(
									this.getNode(),
									'Talent Pool ID is required when associating the candidate with a Talent Pool.',
									{ itemIndex: i },
								);
							}
						}

						const apiUrl = `${cleanBaseUrl}/add-candidate`;

						try {
							const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
							const binaryData = this.helpers.assertBinaryData(i, binaryProperty);
							const cvBuffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);
							const cvFileName = binaryData.fileName || 'cv.pdf';
							const cvMimeType = binaryData.mimeType || 'application/pdf';

							// Build multipart/form-data manually without external dependencies
							const boundary = `----n8nFormBoundary${Date.now().toString(16)}`;

							// Helper function to create form field
							const createTextField = (name: string, value: string): string => {
								return `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
							};

							// Build form parts as string
							let formBody = '';
							formBody += createTextField('first_name', firstName);
							formBody += createTextField('last_name', lastName);
							formBody += createTextField('email', email);

							if (associateWithJobPost) {
								formBody += createTextField('job_post', jobPost);
							}
							if (associateWithTalentPool) {
								formBody += createTextField('talent_pool_id', talentPoolId.toString());
							}
							if (additionalFields.phone_number) {
								formBody += createTextField('phone_number', additionalFields.phone_number);
							}

							// Add file field header
							const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="cv_file"; filename="${cvFileName}"\r\nContent-Type: ${cvMimeType}\r\n\r\n`;
							const fileFooter = `\r\n--${boundary}--\r\n`;

							// Combine all parts into a single Buffer
							const bodyBuffer = Buffer.concat([
								Buffer.from(formBody, 'utf-8'),
								Buffer.from(fileHeader, 'utf-8'),
								cvBuffer,
								Buffer.from(fileFooter, 'utf-8'),
							]);

							// Send multipart/form-data request
							const response = await httpRequestWithRecruspaceAuth(this, {
								method: 'POST',
								url: apiUrl,
								headers: {
									'Content-Type': `multipart/form-data; boundary=${boundary}`,
								},
								body: bodyBuffer,
							});

							const responseObject = response as IDataObject;
							const responseContent =
								(responseObject.content as IDataObject | undefined) ?? responseObject;

							returnData.push({
								json: responseContent,
								pairedItem: { item: i },
							});
						} catch (error: unknown) {
							let errorMessage: unknown = 'Unknown error occurred';
							let statusCode: string | number = 'unknown';

							if (typeof error === 'object' && error !== null) {
								const errorObj = error as {
									response?: {
										data?: unknown;
										status?: number;
									};
									message?: string;
								};

								const responseData = errorObj.response?.data;

								if (typeof responseData === 'object' && responseData !== null) {
									const dataObj = responseData as Record<string, unknown>;
									errorMessage =
										dataObj.detail ??
										dataObj.message ??
										responseData ??
										errorObj.message ??
										errorMessage;
								} else {
									errorMessage = responseData ?? errorObj.message ?? errorMessage;
								}

								if (errorObj.response?.status) {
									statusCode = errorObj.response.status;
								}
							}

							throw new NodeOperationError(
								this.getNode(),
								`Failed to create candidate (${statusCode}): ${JSON.stringify(errorMessage)}\n\nBase URL: ${baseUrl}\nFull URL: ${apiUrl}`,
								{ itemIndex: i },
							);
						}
					} else if (operation === 'addNote') {
						const candidateId = this.getNodeParameter('candidateId', i) as number;
						const noteText = this.getNodeParameter('comment', i) as string;

						if (!candidateId || candidateId === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'Candidate ID is required. Please provide a valid Candidate ID.',
								{ itemIndex: i },
							);
						}

						if (!noteText || noteText.trim() === '') {
							throw new NodeOperationError(
								this.getNode(),
								'Note text is required.',
								{ itemIndex: i },
							);
						}

						const apiUrl = `${cleanBaseUrl}/add-note`;

						try {
							const response = await httpRequestWithRecruspaceAuth(this, {
								method: 'POST',
								url: apiUrl,
								headers: {
									'Content-Type': 'application/json',
								},
								body: {
									candidate_id: candidateId,
									text: noteText,
								},
								json: true,
							});

							returnData.push({
								json: {
									...(response as IDataObject),
									candidate_id: candidateId,
								},
								pairedItem: { item: i },
							});
						} catch (error: unknown) {
							let errorMessage: unknown = 'Unknown error occurred';
							let statusCode: string | number = 'unknown';

							if (typeof error === 'object' && error !== null) {
								const errorObj = error as {
									response?: {
										data?: unknown;
										status?: number;
									};
									message?: string;
								};

								const responseData = errorObj.response?.data;

								if (typeof responseData === 'object' && responseData !== null) {
									const dataObj = responseData as Record<string, unknown>;
									errorMessage =
										dataObj.detail ??
										dataObj.message ??
										responseData ??
										errorObj.message ??
										errorMessage;
								} else {
									errorMessage = responseData ?? errorObj.message ?? errorMessage;
								}

								if (errorObj.response?.status) {
									statusCode = errorObj.response.status;
								}
							}

							throw new NodeOperationError(
								this.getNode(),
								`Failed to add note (${statusCode}): ${JSON.stringify(errorMessage)}\n\nURL: ${apiUrl}\nRequest body: ${JSON.stringify({ candidate_id: candidateId, text: noteText }, null, 2)}`,
								{ itemIndex: i },
							);
						}
					} else if (operation === 'search') {
						const email = this.getNodeParameter('email', i) as string;
						const resultStrategy = this.getNodeParameter('resultStrategy', i) as string;

						if (!email || email.trim() === '') {
							throw new NodeOperationError(
								this.getNode(),
								'Email is required to search for a candidate.',
								{ itemIndex: i },
							);
						}

						try {
							const response = await httpRequestWithRecruspaceAuth(this, {
								method: 'GET',
								url: `${cleanBaseUrl}/actions/candidates/search-by-email`,
								headers: {
									'Content-Type': 'application/json',
								},
								qs: {
									email: email.trim(),
									type: resultStrategy,
								},
								json: true,
							});

							const results = Array.isArray(response) ? response : [response];

							for (const result of results) {
								returnData.push({
									json: result as IDataObject,
									pairedItem: { item: i },
								});
							}
						} catch (error: unknown) {
							throw new NodeOperationError(
								this.getNode(),
								`Failed to search candidate: ${(error as Error).message}`,
								{ itemIndex: i },
							);
						}
					} else if (operation === 'addTag') {
						const candidateId = this.getNodeParameter('tagCandidateId', i) as number;
						const tagTitle = this.getNodeParameter('tagTitle', i) as string;

						if (!candidateId) {
							throw new NodeOperationError(
								this.getNode(),
								'Candidate ID is required to add a tag.',
								{ itemIndex: i },
							);
						}

						if (!tagTitle || tagTitle.trim() === '') {
							throw new NodeOperationError(
								this.getNode(),
								'Tag Title is required.',
								{ itemIndex: i },
							);
						}

						try {
							const response = await httpRequestWithRecruspaceAuth(this, {
								method: 'POST',
								url: `${cleanBaseUrl}/actions/candidates/add-tag`,
								headers: {
									'Content-Type': 'application/json',
								},
								body: {
									candidate_id: candidateId,
									title: tagTitle,
								},
								json: true,
							});

							returnData.push({
								json: response as IDataObject,
								pairedItem: { item: i },
							});
						} catch (error: unknown) {
							const errorObj = error as { response?: { data?: IDataObject, status?: number } };
							let errorMessage = (error as Error).message;

							if (errorObj.response?.data) {
								const data = errorObj.response.data;
								errorMessage = String(data.message || data.error || JSON.stringify(data));
							}

							throw new NodeOperationError(
								this.getNode(),
								`Failed to add tag: ${errorMessage}`,
								{ itemIndex: i },
							);
						}
					}
				} else if (resource === 'talentPool') {
					if (operation === 'create') {
						const talentPoolName = this.getNodeParameter('talentPoolName', i) as string;

						if (!talentPoolName || talentPoolName.trim() === '') {
							throw new NodeOperationError(
								this.getNode(),
								'Talent Pool Name is required.',
								{ itemIndex: i },
							);
						}

						try {
							const response = await httpRequestWithRecruspaceAuth(this, {
								method: 'POST',
								url: `${cleanBaseUrl}/create-talent-pool`,
								headers: {
									'Content-Type': 'application/json',
								},
								body: {
									name: talentPoolName,
								},
								json: true,
							});

							returnData.push({
								json: response as IDataObject,
								pairedItem: { item: i },
							});
						} catch (error: unknown) {
							throw new NodeOperationError(
								this.getNode(),
								`Failed to create talent pool: ${(error as Error).message}`,
								{ itemIndex: i },
							);
						}
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
