import {
	IExecuteFunctions,
} from 'n8n-workflow';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	sleep,
} from 'n8n-workflow';

import { contentdripsApiRequest } from './GenericFunctions';


// Helper function to poll job status until completion
async function pollJobUntilComplete(
	context: IExecuteFunctions,
	jobId: string,
	pollIntervalSeconds: number = 30,
	maxWaitTimeMinutes: number = 10
): Promise<any> {
	const maxAttempts = Math.ceil((maxWaitTimeMinutes * 60) / pollIntervalSeconds);
	let attempts = 0;

	while (attempts < maxAttempts) {
		try {
			// Check job status
			const statusResponse = await contentdripsApiRequest.call(context, 'GET', `/job/${jobId}/status`);
			
			if (statusResponse.status === 'completed') {
				// Job completed, get the result
				const resultResponse = await contentdripsApiRequest.call(context, 'GET', `/job/${jobId}/result`);
				return resultResponse;
			} else if (statusResponse.status === 'failed' || statusResponse.status === 'error') {
				throw new NodeOperationError(context.getNode(), `Job failed: ${statusResponse.message || 'Unknown error'}`);
			}
			
			// Job still processing, wait before next check
			if (attempts < maxAttempts - 1) {
				// Use a simple delay function that's compatible with n8n's restrictions
				await sleep(pollIntervalSeconds * 1000);
			}
			
			attempts++;
		} catch (error) {
			if (error instanceof NodeOperationError) {
				throw error;
			}
			throw new NodeOperationError(context.getNode(), `Error polling job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
	
	throw new NodeOperationError(context.getNode(), `Job timeout: Job ${jobId} did not complete within ${maxWaitTimeMinutes} minutes`);
}

export class Contentdrips implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Contentdrips',
		icon: 'file:contentdrips.svg',
		name: 'contentdrips',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Create carousels and static graphics using the Contentdrips API',
		defaults: {
			name: 'Contentdrips',
		},
	inputs: ['main'],
	outputs: ['main'],
		credentials: [
			{
				name: 'contentdripsApi',
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
						name: 'Graphic',
						value: 'graphic',
						description: 'Generate static graphics',
					},
					{
						name: 'Carousel',
						value: 'carousel',
						description: 'Generate carousel content',
					},
					{
						name: 'Job',
						value: 'job',
						description: 'Check job status and retrieve results',
					},
				],
				default: 'graphic',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['graphic'],
					},
				},
				options: [
					{
						name: 'Generate',
						value: 'generateGraphic',
						description: 'Start creating a graphic and get a job ID to check later',
						action: 'Start creating a graphic and get a job ID to check later',
					},
					{
						name: '1-Click Generate',
						value: 'generateGraphicSync',
						description: 'Create a graphic in one step - we handle everything automatically',
						action: 'Create a graphic in one step - we handle everything automatically',
					},
				],
				default: 'generateGraphic',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['carousel'],
					},
				},
				options: [
					{
						name: 'Generate',
						value: 'generateCarousel',
						description: 'Start creating a carousel and get a job ID to check later',
						action: 'Start creating a carousel and get a job ID to check later',
					},
					{
						name: '1-Click Generate',
						value: 'generateCarouselSync',
						description: 'Create a carousel in one step - we handle everything automatically',
						action: 'Create a carousel in one step - we handle everything automatically',
					},
				],
				default: 'generateCarousel',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['job'],
					},
				},
				options: [
					{
						name: 'Check Status',
						value: 'checkJobStatus',
						description: 'Check the status of a processing job',
						action: 'Check the status of a processing job',
					},
					{
						name: 'Get Result',
						value: 'getJobResult',
						description: 'Get the result of a completed job',
						action: 'Get the result of a completed job',
					},
				],
				default: 'checkJobStatus',
			},

			// Template ID (for both graphic and carousel)
			{
				displayName: 'Template ID',
				name: 'templateId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['graphic', 'carousel'],
					},
				},
				default: '',
				placeholder: '126130',
				description: 'The ID of the template to use for rendering',
				required: true,
			},

			// Output format
			{
				displayName: 'Output Format',
				name: 'output',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['graphic', 'carousel'],
					},
				},
				options: [
					{
						name: 'PNG',
						value: 'png',
					},
					{
						name: 'PDF',
						value: 'pdf',
					},
				],
				default: 'png',
				description: 'The output format for the generated content',
			},

			// Wait settings for operations that wait for results
			{
				displayName: 'Wait Settings',
				name: 'pollingConfig',
				type: 'collection',
				displayOptions: {
					show: {
						resource: ['graphic', 'carousel'],
						operation: ['generateGraphicSync', 'generateCarouselSync'],
					},
				},
				placeholder: 'Customize Wait Settings',
				default: {},
				options: [
					{
						displayName: 'Check Every (seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 30,
						description: 'How often to check if your content is ready (in seconds)',
						typeOptions: {
							minValue: 5,
							maxValue: 300,
						},
					},
					{
						displayName: 'Give Up After (minutes)',
						name: 'maxWaitTime',
						type: 'number',
						default: 10,
						description: 'Stop waiting and show an error after this many minutes',
						typeOptions: {
							minValue: 1,
							maxValue: 60,
						},
					},
				],
			},

			// Include Branding Toggle
			{
				displayName: 'Include Branding',
				name: 'includeBranding',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['graphic', 'carousel'],
					},
				},
				default: false,
				description: 'Whether to include branding information',
			},

			// Branding Collection
			{
				displayName: 'Branding',
				name: 'branding',
				type: 'collection',
				displayOptions: {
					show: {
						resource: ['graphic', 'carousel'],
						includeBranding: [true],
					},
				},
				placeholder: 'Add Branding Field',
				default: {},
				options: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Your name or brand name',
					},
					{
						displayName: 'Handle',
						name: 'handle',
						type: 'string',
						default: '',
						placeholder: '@username',
						description: 'Your social media handle',
					},
					{
						displayName: 'Bio',
						name: 'bio',
						type: 'string',
						default: '',
						description: 'Your bio or tagline',
					},
					{
						displayName: 'Website URL',
						name: 'website_url',
						type: 'string',
						default: '',
						description: 'Your website URL',
					},
					{
						displayName: 'Avatar Image URL',
						name: 'avatar_image_url',
						type: 'string',
						default: '',
						description: 'URL to your avatar/profile image',
					},
				],
			},

			// Content Updates Input Mode
			{
				displayName: 'Content Updates Input',
				name: 'contentUpdatesMode',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['graphic', 'carousel'],
					},
				},
				options: [
					{
						name: 'Use Form (Easy)',
						value: 'form',
					},
					{
						name: 'Use JSON (Advanced)',
						value: 'json',
					},
				],
				default: 'form',
				description: 'Choose how to provide content updates',
			},

			// Content Updates - Form Mode
			{
				displayName: 'Content Updates',
				name: 'contentUpdates',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						resource: ['graphic', 'carousel'],
						contentUpdatesMode: ['form'],
					},
				},
				placeholder: 'Add Content Update',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						name: 'updates',
						displayName: 'Update',
						values: [
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'Text Box',
										value: 'textbox',
									},
									{
										name: 'Image',
										value: 'image',
									},
								],
								default: 'textbox',
								description: 'The type of element to update',
							},
							{
								displayName: 'Label',
								name: 'label',
								type: 'string',
								default: '',
								description: 'The label of the element to update (set in Contentdrips editor)',
								required: true,
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'The new value for the element',
								required: true,
							},
						],
					},
				],
			},

			// Content Updates - JSON Mode
			{
				displayName: 'Content Updates JSON',
				name: 'contentUpdatesJson',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['graphic', 'carousel'],
						contentUpdatesMode: ['json'],
					},
				},
				default: '[\n  {\n    "type": "textbox",\n    "label": "title",\n    "value": "My Custom Title"\n  },\n  {\n    "type": "image",\n    "label": "background",\n    "value": "https://example.com/image.jpg"\n  }\n]',
				description: 'Content updates as JSON array. Each object should have: type, label, and value',
				placeholder: 'Enter content updates as JSON...',
			},

			// Carousel Input Mode
			{
				displayName: 'Carousel Input',
				name: 'carouselMode',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['carousel'],
					},
				},
				options: [
					{
						name: 'Use Form (Easy)',
						value: 'form',
					},
					{
						name: 'Use JSON (Advanced)',
						value: 'json',
					},
				],
				default: 'form',
				description: 'Choose how to provide carousel data',
			},

			// Carousel - Form Mode - Intro Slide
			{
				displayName: 'Intro Slide',
				name: 'introSlide',
				type: 'collection',
				displayOptions: {
					show: {
						resource: ['carousel'],
						carouselMode: ['form'],
					},
				},
				placeholder: 'Add Intro Slide',
				default: {},
				options: [
					{
						displayName: 'Heading',
						name: 'heading',
						type: 'string',
						default: '',
						description: 'Heading for the intro slide',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Description for the intro slide',
					},
					{
						displayName: 'Image URL',
						name: 'image',
						type: 'string',
						default: '',
						description: 'Image URL for the intro slide',
					},
				],
			},

			// Carousel - Form Mode - Content Slides
			{
				displayName: 'Slides',
				name: 'slides',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						resource: ['carousel'],
						carouselMode: ['form'],
					},
				},
				placeholder: 'Add Slide',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						name: 'slide',
						displayName: 'Slide',
						values: [
							{
								displayName: 'Heading',
								name: 'heading',
								type: 'string',
								default: '',
								description: 'Heading for this slide',
							},
							{
								displayName: 'Description',
								name: 'description',
								type: 'string',
								default: '',
								description: 'Description for this slide',
							},
							{
								displayName: 'Image URL',
								name: 'image',
								type: 'string',
								default: '',
								description: 'Image URL for this slide',
							},
						],
					},
				],
			},

			// Carousel - Form Mode - Ending Slide
			{
				displayName: 'Ending Slide',
				name: 'endingSlide',
				type: 'collection',
				displayOptions: {
					show: {
						resource: ['carousel'],
						carouselMode: ['form'],
					},
				},
				placeholder: 'Add Ending Slide',
				default: {},
				options: [
					{
						displayName: 'Heading',
						name: 'heading',
						type: 'string',
						default: '',
						description: 'Heading for the ending slide',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Description for the ending slide',
					},
					{
						displayName: 'Image URL',
						name: 'image',
						type: 'string',
						default: '',
						description: 'Image URL for the ending slide',
					},
				],
			},

			// Carousel - JSON Mode
			{
				displayName: 'Carousel JSON',
				name: 'carouselJson',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['carousel'],
						carouselMode: ['json'],
					},
				},
				default: '{\n  "intro_slide": {\n    "heading": "Welcome",\n    "description": "This is the intro slide",\n    "image": "https://example.com/intro.jpg"\n  },\n  "slides": [\n    {\n      "heading": "Slide 1",\n      "description": "Content for slide 1",\n      "image": "https://example.com/slide1.jpg"\n    },\n    {\n      "heading": "Slide 2",\n      "description": "Content for slide 2",\n      "image": "https://example.com/slide2.jpg"\n    }\n  ],\n  "ending_slide": {\n    "heading": "Thank You",\n    "description": "This is the ending slide",\n    "image": "https://example.com/ending.jpg"\n  }\n}',
				description: 'Complete carousel data as JSON. Include intro_slide, slides array, and ending_slide',
				placeholder: 'Enter carousel data as JSON...',
			},

			// Job Status/Result Options
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['job'],
					},
				},
				default: '',
				placeholder: '15bf4a39-876a-4780-aaa9-4be6fe2c61b4',
				description: 'The ID of the job to check/retrieve',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				if (resource === 'graphic') {
					const templateId = this.getNodeParameter('templateId', i) as string;
					const output = this.getNodeParameter('output', i) as string;
					const includeBranding = this.getNodeParameter('includeBranding', i) as boolean;
					const contentUpdatesMode = this.getNodeParameter('contentUpdatesMode', i) as string;

					const body: IDataObject = {
						template_id: templateId,
						output,
					};

					// Add branding if included
					if (includeBranding) {
						const branding = this.getNodeParameter('branding', i) as IDataObject;
						if (Object.keys(branding).length > 0) {
							body.branding = branding;
						}
					}

					// Add content updates based on selected mode
					if (contentUpdatesMode === 'json') {
						const contentUpdatesJson = this.getNodeParameter('contentUpdatesJson', i) as string;
						if (contentUpdatesJson && contentUpdatesJson.trim()) {
							try {
								const parsedUpdates = JSON.parse(contentUpdatesJson);
								if (Array.isArray(parsedUpdates) && parsedUpdates.length > 0) {
									body.content_update = parsedUpdates;
								}
							} catch (error) {
								throw new NodeOperationError(this.getNode(), `Invalid Content Updates JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
							}
						}
					} else {
						// Form mode
						const contentUpdates = this.getNodeParameter('contentUpdates', i) as IDataObject;
						if (contentUpdates && contentUpdates.updates) {
							body.content_update = contentUpdates.updates;
						}
					}

					// Make the initial API call
					const initialResponse = await contentdripsApiRequest.call(this, 'POST', '/render', body);

					if (operation === 'generateGraphicSync') {
						// Get polling configuration
						const pollingConfig = this.getNodeParameter('pollingConfig', i, {}) as IDataObject;
						const pollInterval = (pollingConfig.pollInterval as number) || 30;
						const maxWaitTime = (pollingConfig.maxWaitTime as number) || 10;

						// Extract job ID from the initial response
						const jobId = initialResponse.job_id || initialResponse.id;
						if (!jobId) {
							throw new NodeOperationError(this.getNode(), 'No job ID returned from API');
						}

						// Poll until completion and get the final result
						responseData = await pollJobUntilComplete(this, jobId, pollInterval, maxWaitTime);
					} else {
						responseData = initialResponse;
					}

				} else if (resource === 'carousel') {
					const templateId = this.getNodeParameter('templateId', i) as string;
					const output = this.getNodeParameter('output', i) as string;
					const includeBranding = this.getNodeParameter('includeBranding', i) as boolean;
					const contentUpdatesMode = this.getNodeParameter('contentUpdatesMode', i) as string;
					const carouselMode = this.getNodeParameter('carouselMode', i) as string;

					const body: IDataObject = {
						template_id: templateId,
						output,
					};

					// Add branding if included
					if (includeBranding) {
						const branding = this.getNodeParameter('branding', i) as IDataObject;
						if (Object.keys(branding).length > 0) {
							body.branding = branding;
						}
					}

					// Add content updates based on selected mode
					if (contentUpdatesMode === 'json') {
						const contentUpdatesJson = this.getNodeParameter('contentUpdatesJson', i) as string;
						if (contentUpdatesJson && contentUpdatesJson.trim()) {
							try {
								const parsedUpdates = JSON.parse(contentUpdatesJson);
								if (Array.isArray(parsedUpdates) && parsedUpdates.length > 0) {
									body.content_update = parsedUpdates;
								}
							} catch (error) {
								throw new NodeOperationError(this.getNode(), `Invalid Content Updates JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
							}
						}
					} else {
						// Form mode
						const contentUpdates = this.getNodeParameter('contentUpdates', i) as IDataObject;
						if (contentUpdates && contentUpdates.updates) {
							body.content_update = contentUpdates.updates;
						}
					}

					// Build carousel object based on selected mode
					if (carouselMode === 'json') {
						const carouselJson = this.getNodeParameter('carouselJson', i) as string;
						if (carouselJson && carouselJson.trim()) {
							try {
								const parsedCarousel = JSON.parse(carouselJson);
								if (parsedCarousel && typeof parsedCarousel === 'object') {
									body.carousel = parsedCarousel;
								}
							} catch (error) {
								throw new NodeOperationError(this.getNode(), `Invalid Carousel JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
							}
						}
					} else {
						// Form mode
						const introSlide = this.getNodeParameter('introSlide', i) as IDataObject;
						const slides = this.getNodeParameter('slides', i) as IDataObject;
						const endingSlide = this.getNodeParameter('endingSlide', i) as IDataObject;

						const carousel: IDataObject = {};
						
						if (Object.keys(introSlide).length > 0) {
							carousel.intro_slide = introSlide;
						}
						
						if (slides && slides.slide && Array.isArray(slides.slide)) {
							carousel.slides = slides.slide;
						}
						
						if (Object.keys(endingSlide).length > 0) {
							carousel.ending_slide = endingSlide;
						}

						if (Object.keys(carousel).length > 0) {
							body.carousel = carousel;
						}
					}

					// Make the initial API call
					const initialResponse = await contentdripsApiRequest.call(this, 'POST', '/render?tool=carousel-maker', body);

					if (operation === 'generateCarouselSync') {
						// Get polling configuration
						const pollingConfig = this.getNodeParameter('pollingConfig', i, {}) as IDataObject;
						const pollInterval = (pollingConfig.pollInterval as number) || 30;
						const maxWaitTime = (pollingConfig.maxWaitTime as number) || 10;

						// Extract job ID from the initial response
						const jobId = initialResponse.job_id || initialResponse.id;
						if (!jobId) {
							throw new NodeOperationError(this.getNode(), 'No job ID returned from API');
						}

						// Poll until completion and get the final result
						responseData = await pollJobUntilComplete(this, jobId, pollInterval, maxWaitTime);
					} else {
						responseData = initialResponse;
					}

				} else if (resource === 'job') {
					const jobId = this.getNodeParameter('jobId', i) as string;
					
					if (operation === 'checkJobStatus') {
						responseData = await contentdripsApiRequest.call(this, 'GET', `/job/${jobId}/status`);
					} else if (operation === 'getJobResult') {
						responseData = await contentdripsApiRequest.call(this, 'GET', `/job/${jobId}/result`);
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown job operation: ${operation}`);
					}

				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
				}

				returnData.push({
					json: responseData,
					pairedItem: {
						item: i,
					},
				});

			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({
						json: {
							error: errorMessage,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
} 