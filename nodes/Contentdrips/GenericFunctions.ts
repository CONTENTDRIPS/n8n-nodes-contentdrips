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

	try {
		return await this.helpers.httpRequest(options);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`Contentdrips API request failed: ${errorMessage}`);
	}
} 