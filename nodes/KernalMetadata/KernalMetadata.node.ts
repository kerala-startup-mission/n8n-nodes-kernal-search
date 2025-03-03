import {
    IExecuteFunctions,
    INodeType,
    INodeTypeDescription,
    ILoadOptionsFunctions,
    NodeConnectionType,
    NodeApiError,
    NodeOperationError,
    INodeExecutionData,
} from 'n8n-workflow';

export class KernalMetadata implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Kernel Metadata',
        name: 'kernalMetadata',
        group: ['transform'],
        icon: 'file:logo.svg',
        version: 1,
        description: 'Fetch metadata for sectors, industries, technologies, and business models from Kernal API',
        defaults: {
            name: 'Kernel Metadata',
        },
        inputs: ['main' as NodeConnectionType],
        outputs: ['main' as NodeConnectionType],
        credentials: [
            {
                name: 'kernalApiAuthApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Metadata Type',
                name: 'metadata',
                type: 'options',
                options: [
                    { name: 'Sector', value: 'sector' },
                    { name: 'Industry', value: 'industry' },
                    { name: 'Technology', value: 'technology' },
                    { name: 'Business Model', value: 'business_model' },
                    { name: 'State', value: 'state' },
                    { name: 'District', value: 'district' },
                ],
                default: 'sector',
                required: true,
                description: 'Select the type of metadata to fetch',
            },
            {
                displayName: 'Filter',
                name: 'filter',
                type: 'options',
                default: '',
                typeOptions: {
                    loadOptionsMethod: 'getFilters',
                    loadOptionsDependsOn: ['metadata'],
                },
                displayOptions: {
                    show: {
                        metadata: ['industry', 'district'],
                    },
                },
                description: 'Filter industries by sector (only applicable if metadata type is Industry), Filter districts by state (only applicable if metadata type is District)',
            },
        ],
    };

    async execute(this: IExecuteFunctions) {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        const credentials = await this.getCredentials('kernalApiAuthApi');
        if (!credentials) {
            throw new NodeOperationError(this.getNode(), 'Missing API credentials.');
        }

        for (let i = 0; i < items.length; i++) {
            try {

                const metadataType = this.getNodeParameter('metadata', i) as string;
                const filter = this.getNodeParameter('filter', i, '') as string;

                const headers = {
                    'x-auth-key': credentials.authKey,
                    'x-auth-secret': credentials.authSecret,
                };

                const body: Record<string, string> = {};
                if ((metadataType === 'industry' || metadataType == "district") && filter) {
                    body['filter'] = filter;
                }

                const response = await this.helpers.request({
                    method: 'POST',
                    url: `https://startups.startupmission.in/api/v1/startup/meta/${metadataType}`,
                    headers,
                    body,
                    json: true,
                });

                returnData.push(...response.map((data: any) => ({ json: { name: data } })));

            } catch (error) {
                throw new NodeApiError(this.getNode(), error);
            }
        }

        return [returnData];
    }

    methods = {
        loadOptions: {
            async getFilters(this: ILoadOptionsFunctions) {
                const metadata = this.getCurrentNodeParameter('metadata') as string;
                if(metadata == "industry"){
                    return KernalMetadata.fetchMetadataOptions.call(this, 'sector');
                }
                else if(metadata == "district"){
                    return KernalMetadata.fetchMetadataOptions.call(this, 'state');
                }
            },
        },
    };

    static async fetchMetadataOptions(
        this: ILoadOptionsFunctions, 
        parameterName: string, 
        extraParams: Record<string, string> = {}
    ) {
        try {
            const credentials = await this.getCredentials('kernalApiAuthApi');
            if (!credentials) {
                throw new NodeOperationError(this.getNode(), 'Missing API credentials.');
            }

            const headers = {
                'x-auth-key': credentials.authKey,
                'x-auth-secret': credentials.authSecret,
            };

            const response = await this.helpers.request({
                method: 'POST',
                url: `https://startups.startupmission.in/api/v1/startup/meta/${parameterName}`,
                headers,
                body: extraParams,
                json: true,
            });

            const options = response.map((item: string) => ({
                name: item,
                value: item,
            }));

            options.unshift({ name: '---select---', value: '' });

            return options;

        } catch (error) {
            throw new NodeApiError(this.getNode(), error);
        }
    }

}