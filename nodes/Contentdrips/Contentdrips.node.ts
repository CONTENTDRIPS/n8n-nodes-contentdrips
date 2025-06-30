import {
	IExecuteFunctions,
} from 'n8n-workflow';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { contentdripsApiRequest } from './GenericFunctions';

export class Contentdrips implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Contentdrips',
		name: 'contentdrips',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Create carousels and static graphics using the Contentdrips API',
		defaults: {
			name: 'Contentdrips',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'contentdripsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Generate Graphic',
						value: 'generateGraphic',
						description: 'Create a static graphic from a template',
						action: 'Generate a static graphic from a template',
					},
					{
						name: 'Generate Carousel',
						value: 'generateCarousel',
						description: 'Create a multi-slide carousel',
						action: 'Generate a multi-slide carousel',
					},
					{
						name: 'Check Job Status',
						value: 'checkJobStatus',
						description: 'Check the status of a processing job',
						action: 'Check the status of a processing job',
					},
					{
						name: 'Get Job Result',
						value: 'getJobResult',
						description: 'Get the result of a completed job',
						action: 'Get the result of a completed job',
					},
				],
				default: 'generateGraphic',
			},

			// Template ID (for both graphic and carousel)
			{
				displayName: 'Template ID',
				name: 'templateId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['generateGraphic', 'generateCarousel'],
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
						operation: ['generateGraphic', 'generateCarousel'],
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

			// Include Branding Toggle
			{
				displayName: 'Include Branding',
				name: 'includeBranding',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['generateGraphic', 'generateCarousel'],
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
						operation: ['generateGraphic', 'generateCarousel'],
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

			// Content Updates
			{
				displayName: 'Content Updates',
				name: 'contentUpdates',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						operation: ['generateGraphic', 'generateCarousel'],
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

			// Carousel - Intro Slide
			{
				displayName: 'Intro Slide',
				name: 'introSlide',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['generateCarousel'],
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

			// Carousel - Content Slides
			{
				displayName: 'Slides',
				name: 'slides',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						operation: ['generateCarousel'],
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

			// Carousel - Ending Slide
			{
				displayName: 'Ending Slide',
				name: 'endingSlide',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['generateCarousel'],
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

			// Job Status/Result Options
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['checkJobStatus', 'getJobResult'],
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

		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				if (operation === 'generateGraphic') {
					const templateId = this.getNodeParameter('templateId', i) as string;
					const output = this.getNodeParameter('output', i) as string;
					const includeBranding = this.getNodeParameter('includeBranding', i) as boolean;
					const contentUpdates = this.getNodeParameter('contentUpdates', i) as IDataObject;

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

					// Add content updates
					if (contentUpdates && contentUpdates.updates) {
						body.content_update = contentUpdates.updates;
					}

					responseData = await contentdripsApiRequest.call(this, 'POST', '/render', body);

				} else if (operation === 'generateCarousel') {
					const templateId = this.getNodeParameter('templateId', i) as string;
					const output = this.getNodeParameter('output', i) as string;
					const includeBranding = this.getNodeParameter('includeBranding', i) as boolean;
					const contentUpdates = this.getNodeParameter('contentUpdates', i) as IDataObject;
					const introSlide = this.getNodeParameter('introSlide', i) as IDataObject;
					const slides = this.getNodeParameter('slides', i) as IDataObject;
					const endingSlide = this.getNodeParameter('endingSlide', i) as IDataObject;

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

					// Add content updates
					if (contentUpdates && contentUpdates.updates) {
						body.content_update = contentUpdates.updates;
					}

					// Build carousel object
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

					responseData = await contentdripsApiRequest.call(this, 'POST', '/render?tool=carousel-maker', body);

				} else if (operation === 'checkJobStatus') {
					const jobId = this.getNodeParameter('jobId', i) as string;
					responseData = await contentdripsApiRequest.call(this, 'GET', `/job/${jobId}/status`);

				} else if (operation === 'getJobResult') {
					const jobId = this.getNodeParameter('jobId', i) as string;
					responseData = await contentdripsApiRequest.call(this, 'GET', `/job/${jobId}/result`);

				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
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