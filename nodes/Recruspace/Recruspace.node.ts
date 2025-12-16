import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import FormData from 'form-data';
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import * as fs from 'fs';
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import * as path from 'path';

export class Recruspace implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Recruspace',
		name: 'recruspace',
		icon: 'file:recruspace.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Recruspace API',
		defaults: {
			name: 'Recruspace',
		},
		usableAsTool: true,
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
                        name: 'File',
                        value: 'file',
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
                        action: 'Create a candidate',
                    },
                    {
                        name: 'Add Comment',
                        value: 'addComment',
                        description: 'Add a comment to a candidate',
                        action: 'Add comment to candidate',
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
                        resource: ['file'],
                    },
                },
                options: [
                    {
                        name: 'Upload CV',
                        value: 'uploadCV',
                        description: 'Upload a CV file and get document ID',
                        action: 'Upload CV file',
                    },
                ],
                default: 'uploadCV',
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
                        action: 'Create a talent pool',
                    },
                ],
                default: 'create',
            },

            // Create Candidate Fields
            {
                displayName: 'First Name',
                name: 'firstName',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['candidate'],
                        operation: ['create'],
                    },
                },
                default: '',
                description: 'The first name of the candidate',
            },
            {
                displayName: 'Last Name',
                name: 'lastName',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['candidate'],
                        operation: ['create'],
                    },
                },
                default: '',
                description: 'The last name of the candidate',
            },
            {
                displayName: 'Email',
                name: 'email',
                type: 'string',
                placeholder: 'name@email.com',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['candidate'],
                        operation: ['create'],
                    },
                },
                default: '',
                description: 'The email of the candidate',
            },
            {
                displayName: 'CV Source',
                name: 'cvSource',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['candidate'],
                        operation: ['create'],
                    },
                },
                options: [
                    {
                        name: 'Binary Data',
                        value: 'binaryData',
                        description: 'Upload CV file directly from previous node binary data (multipart/form-data)',
                    },
                ],
                default: 'binaryData',
                description: 'Where to get the CV from (only binary data is supported for candidates)',
            },
            {
                displayName: 'Binary Property',
                name: 'binaryProperty',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['candidate'],
                        operation: ['create'],
                        cvSource: ['binaryData'],
                    },
                },
                default: 'data',
                required: true,
                description: 'Name of the binary property containing the CV file',
                placeholder: 'data',
            },
            {
                displayName: 'Associate With',
                name: 'associationType',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['candidate'],
                        operation: ['create'],
                    },
                },
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
            },
            {
                displayName: 'Job Post Hash',
                name: 'jobPost',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['candidate'],
                        operation: ['create'],
                        associationType: ['jobPost'],
                    },
                },
                default: '',
                description: 'Job post hash to associate with the candidate',
                placeholder: '7f0d01fb1a4f4f7b8fd8bc2c33fe2665',
            },
            {
                displayName: 'Talent Pool ID',
                name: 'talentPoolId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['candidate'],
                        operation: ['create'],
                        associationType: ['talentPool'],
                    },
                },
                default: 0,
                description: 'Talent pool ID to add the candidate to',
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

            // Add Comment Fields
            {
                displayName: 'Candidate ID',
                name: 'candidateId',
                type: 'number',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['candidate'],
                        operation: ['addComment'],
                    },
                },
                default: 0,
                description: 'The ID of the candidate to add note to',
                placeholder: '12345',
            },
            {
                displayName: 'Note Text',
                name: 'comment',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                required: true,
                displayOptions: {
                    show: {
                        resource: ['candidate'],
                        operation: ['addComment'],
                    },
                },
                default: '',
                description: 'The note text to add',
            },

            // File Upload Fields
            {
                displayName: 'CV Source',
                name: 'cvSource',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['file'],
                        operation: ['uploadCV'],
                    },
                },
                options: [
                    {
                        name: 'Binary Data',
                        value: 'binaryData',
                        description: 'Use CV from previous node binary data',
                    },
                    {
                        name: 'File Path',
                        value: 'filePath',
                        description: 'Upload CV from local file path',
                    },
                ],
                default: 'binaryData',
                description: 'Where to get the CV file from',
            },
            {
                displayName: 'Binary Property',
                name: 'binaryProperty',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['file'],
                        operation: ['uploadCV'],
                        cvSource: ['binaryData'],
                    },
                },
                default: 'data',
                required: true,
                description: 'Name of the binary property containing the CV file',
                placeholder: 'data',
            },
            {
                displayName: 'File Path',
                name: 'filePath',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['file'],
                        operation: ['uploadCV'],
                        cvSource: ['filePath'],
                    },
                },
                default: '',
                required: true,
                description: 'Path to the CV file (e.g., /path/to/resume.pdf)',
                placeholder: '/Users/username/Documents/resume.pdf',
            },

            // Talent Pool Fields
            {
                displayName: 'Name',
                name: 'talentPoolName',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['talentPool'],
                        operation: ['create'],
                    },
                },
                default: '',
                placeholder: 'Software Developer Talents',
                description: 'The name of the talent pool',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const resource = this.getNodeParameter('resource', 0);
        const operation = this.getNodeParameter('operation', 0);
        const credentials = await this.getCredentials('recruspaceApi');
        const baseUrl = (credentials.baseUrl as string) || 'https://dev.api.recruspace.com/';

        for (let i = 0; i < items.length; i++) {
            try {
                if (resource === 'file') {
                    if (operation === 'uploadCV') {
                        // Upload CV File
                        const cvSource = this.getNodeParameter('cvSource', i) as string;

                        let cvBuffer: Buffer;
                        let cvFileName: string;
                        let cvMimeType: string;

                        // Get CV file based on source
                        if (cvSource === 'binaryData') {
                            // Get from binary data
                            const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
                            const binaryData = this.helpers.assertBinaryData(i, binaryProperty);
                            cvBuffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);
                            cvFileName = binaryData.fileName || 'cv.pdf';
                            cvMimeType = binaryData.mimeType || 'application/pdf';
                        } else {
                            // Get from file path
                            const filePath = this.getNodeParameter('filePath', i) as string;

                            cvBuffer = fs.readFileSync(filePath);
                            cvFileName = path.basename(filePath);

                            // Determine MIME type based on extension
                            const ext = path.extname(filePath).toLowerCase();
                            if (ext === '.pdf') {
                                cvMimeType = 'application/pdf';
                            } else if (ext === '.doc') {
                                cvMimeType = 'application/msword';
                            } else if (ext === '.docx') {
                                cvMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                            } else {
                                cvMimeType = 'application/octet-stream';
                            }
                        }

                        // Upload CV File
                        const uploadFormData = new FormData();
                        uploadFormData.append('file', cvBuffer, {
                            filename: cvFileName,
                            contentType: cvMimeType,
                        });
                        uploadFormData.append('folder_key', 'cv');

                        const uploadResponse = await this.helpers.httpRequest({
                            method: 'POST',
                            url: `${baseUrl}/api/v1/utilities/upload-file/`,
                            headers: {
                                ...uploadFormData.getHeaders(),
                            },
                            body: uploadFormData,
                        });

                        // Response structure: { success: "OK", content: { id: 39384, ... } }
                        const uploadResponseObject = uploadResponse as IDataObject;
                        const responseData =
                            (uploadResponseObject.content as IDataObject | undefined) ?? uploadResponseObject;

                        returnData.push({
                            json: responseData,
                            pairedItem: { item: i },
                        });
                    }
                } else if (resource === 'candidate') {
                    if (operation === 'create') {
                        // Create Candidate (Integration Endpoint)
                        // Company is automatically extracted from API Key
                        const firstName = this.getNodeParameter('firstName', i) as string;
                        const lastName = this.getNodeParameter('lastName', i) as string;
                        const email = this.getNodeParameter('email', i) as string;
                        const cvSource = this.getNodeParameter('cvSource', i) as string;
                        const associationType = this.getNodeParameter('associationType', i) as string;
                        const jobPost = this.getNodeParameter('jobPost', i, '') as string;
                        const talentPoolId = this.getNodeParameter('talentPoolId', i, 0) as number;
                        const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

                        // Validate CV source
                        if (cvSource !== 'binaryData') {
                            throw new NodeOperationError(
                                this.getNode(),
                                'Only "Binary Data" is supported as CV Source for creating candidates. Please provide CV as binary data from a previous node.',
                            );
                        }

                        // Determine association based on selection
                        const associateWithJobPost = associationType === 'jobPost';
                        const associateWithTalentPool = associationType === 'talentPool';

                        if (associateWithJobPost) {
                            if (!jobPost || jobPost.trim() === '') {
                                throw new NodeOperationError(
                                    this.getNode(),
                                    'Job Post Hash is required when associating the candidate with a Job Post.',
                                );
                            }
                        } else if (associateWithTalentPool) {
                            if (!talentPoolId || talentPoolId <= 0) {
                                throw new NodeOperationError(
                                    this.getNode(),
                                    'Talent Pool ID is required when associating the candidate with a Talent Pool.',
                                );
                            }
                        } else {
                            throw new NodeOperationError(
                                this.getNode(),
                                'Invalid association type. Please choose either Job Post or Talent Pool.',
                            );
                        }

                        // Ensure baseUrl doesn't have trailing slash
                        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                        // Build the API URL - Django typically uses trailing slash
                        const apiUrl = `${cleanBaseUrl}/api/v1/client/candidates/add/`;

                        try {
                            // We only support binaryData at this point (validated above)
                            // Upload CV file directly using multipart/form-data
                            const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
                            const binaryData = this.helpers.assertBinaryData(i, binaryProperty);
                            const cvBuffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);
                            const cvFileName = binaryData.fileName || 'cv.pdf';
                            const cvMimeType = binaryData.mimeType || 'application/pdf';

                            // Create FormData for multipart/form-data request
                            const formData = new FormData();
                            formData.append('first_name', firstName);
                            formData.append('last_name', lastName);
                            formData.append('email', email);
                            formData.append('cv_file', cvBuffer, {
                                filename: cvFileName,
                                contentType: cvMimeType,
                            });

                            // Add association - either job_post or talent_pool_id (based on associationType)
                            if (associateWithJobPost) {
                                formData.append('job_post', jobPost);
                            }
                            if (associateWithTalentPool) {
                                formData.append('talent_pool_id', talentPoolId.toString());
                            }

                            // Add optional fields
                            if (additionalFields.phone_number) {
                                formData.append('phone_number', additionalFields.phone_number as string);
                            }

                            const response = await this.helpers.httpRequest({
                                method: 'POST',
                                url: apiUrl,
                                headers: {
                                    'Authorization': `Bearer ${credentials.apiKey}`,
                                    ...formData.getHeaders(),
                                },
                                body: formData,
                            });

                            // Handle response structure: { success: "OK", content: {...} }
                            const responseObject = response as IDataObject;
                            const responseContent =
                                (responseObject.content as IDataObject | undefined) ?? responseObject;

                            returnData.push({
                                json: responseContent,
                                pairedItem: { item: i },
                            });
                        } catch (error: unknown) {
                            // Better error handling to show backend error details
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
                            );
                        }
                    } else if (operation === 'addComment') {
                        // Add Note using Integration Endpoint
                        const candidateId = this.getNodeParameter('candidateId', i) as number;
                        const noteText = this.getNodeParameter('comment', i) as string;

                        // Validate required fields
                        if (!candidateId || candidateId === 0) {
                            throw new NodeOperationError(
                                this.getNode(),
                                'Candidate ID is required. Please provide a valid Candidate ID.',
                            );
                        }

                        // Ensure baseUrl doesn't have trailing slash
                        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                        const apiUrl = `${cleanBaseUrl}/api/v1/candidates/integration/add-note/`;

                        try {
                            const response = await this.helpers.httpRequest({
                                method: 'POST',
                                url: apiUrl,
                                headers: {
                                    'Authorization': `Bearer ${credentials.apiKey}`,
                                    'Content-Type': 'application/json',
                                },
                                body: {
                                    candidate_id: candidateId,
                                    text: noteText,
                                },
                                json: true,
                            });

                            returnData.push({
                                json: response as IDataObject,
                                pairedItem: { item: i },
                            });
                        } catch (error: unknown) {
                            // Better error handling to show backend error details
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
                            );
                        }
                    }
                } else if (resource === 'talentPool') {
                    if (operation === 'create') {
                        // Create Talent Pool
                        const talentPoolName = this.getNodeParameter('talentPoolName', i) as string;

                        const response = await this.helpers.httpRequest({
                            method: 'POST',
                            url: `${baseUrl}/api/v1/client/talent-pools/create/`,
                            headers: {
                                'Authorization': `Bearer ${credentials.apiKey}`,
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
