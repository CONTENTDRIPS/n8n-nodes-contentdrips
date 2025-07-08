import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
} from 'n8n-workflow';

export class ContentdripsApi implements ICredentialType {
	name = 'contentdripsApi';
	displayName = 'Contentdrips API';
	documentationUrl = 'https://app.contentdrips.com/api-management';
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Contentdrips API token. Get it from https://app.contentdrips.com/api-management',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://generate.contentdrips.com',
			url: '/render',
			method: 'POST',
		},
	};
} 