import {
	IExecuteFunctions,
	IHookFunctions,
	IDataObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';

export async function contentdripsApiRequest(
	this: IHookFunctions | IExecuteFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: any = {},
	qs: IDataObject = {},
	uri?: string,
	headers: IDataObject = {},
): Promise<any> {
	
	const credentials = await this.getCredentials('contentdripsApi');
	
	// Debug logging
	console.log('DEBUG - Credentials retrieved:', credentials ? 'YES' : 'NO');
	console.log('DEBUG - API Token present:', credentials?.apiToken ? 'YES' : 'NO');
	console.log('DEBUG - API Token length:', credentials?.apiToken ? String(credentials.apiToken).length : 0);

	const url = uri || `https://generate.contentdrips.com${resource}`;

	const options: IHttpRequestOptions = {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${credentials?.apiToken}`,
			...headers,
		},
		method,
		qs,
		body,
		url,
		json: true,
	};

	console.log('DEBUG - Request URL:', url);
	console.log('DEBUG - Request method:', method);
	console.log('DEBUG - Authorization header:', options.headers?.Authorization ? 'SET' : 'NOT SET');
	console.log('DEBUG - Request body:', JSON.stringify(body, null, 2));
	console.log('DEBUG - Body keys:', Object.keys(body || {}));

	try {
		return await this.helpers.httpRequest(options);
	} catch (error: any) {
		// Enhanced error handling to show actual API error details
		let errorMessage = 'Unknown error';
		let apiErrorDetails = null;
		
		if (error.response) {
			// HTTP error with response
			const statusCode = error.response.status || 'unknown';
			const statusText = error.response.statusText || '';
			
			// Try to get API error details from response body
			if (error.response.data) {
				apiErrorDetails = error.response.data;
				
				// If API returns error message in specific format
				if (typeof apiErrorDetails === 'object') {
					if (apiErrorDetails.error) {
						errorMessage = apiErrorDetails.error;
					} else if (apiErrorDetails.message) {
						errorMessage = apiErrorDetails.message;
					} else if (apiErrorDetails.details) {
						errorMessage = apiErrorDetails.details;
					} else {
						errorMessage = JSON.stringify(apiErrorDetails);
					}
				} else if (typeof apiErrorDetails === 'string') {
					errorMessage = apiErrorDetails;
				}
			}
			
			// Fallback to status text if no detailed error
			if (!apiErrorDetails && statusText) {
				errorMessage = `${statusCode} ${statusText}`;
			}
			
			console.log('DEBUG - API Error Response:', JSON.stringify({
				status: statusCode,
				statusText,
				data: apiErrorDetails,
			}, null, 2));
			
		} else if (error.message) {
			// Non-HTTP error (network, etc.)
			errorMessage = error.message;
		}
		
		// Create detailed error message
		const detailedError = apiErrorDetails 
			? `${errorMessage} | Response: ${JSON.stringify(apiErrorDetails)}`
			: errorMessage;
			
		throw new Error(`Contentdrips API Error: ${detailedError}`);
	}
} 