import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
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

    // Define how to authenticate API requests
    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                'Authorization': '=Bearer {{$credentials.apiToken}}',
            },
        },
    };

    // Test the credential by calling the validation endpoint
    test: ICredentialTestRequest = {
        request: {
            baseURL: 'https://api.contentdrips.com',
            url: '/api/validate-token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    };
}