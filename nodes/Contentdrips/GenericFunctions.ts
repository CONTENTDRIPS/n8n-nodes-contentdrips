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
	
	// Debug logging - using n8n logger
	this.logger.debug('Contentdrips API credentials check', {
		credentialsRetrieved: credentials ? true : false,
		apiTokenPresent: credentials?.apiToken ? true : false,
		apiTokenLength: credentials?.apiToken ? String(credentials.apiToken).length : 0,
	});

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

	this.logger.debug('Contentdrips API request details', {
		url,
		method,
		authHeaderPresent: options.headers?.Authorization ? true : false,
		bodyKeys: Object.keys(body || {}),
		// Don't log full body as it may contain sensitive data
	});

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
			
			this.logger.debug('Contentdrips API error response', {
				status: statusCode,
				statusText,
				hasErrorData: apiErrorDetails ? true : false,
			});
			
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