import { 
    IExecuteFunctions, 
    ILoadOptionsFunctions, 
    INodeExecutionData, 
    INodeType, 
    INodeTypeDescription, 
    NodeApiError, 
    NodeOperationError,
	NodeConnectionType
} from 'n8n-workflow';

export class KernalSearch implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Kernel Search',
        name: 'kernalSearch',
        group: ['transform'],
        version: 1,
        icon: 'file:logo.svg',
        description: 'Search startups in the Kernel platform by Kerala Startup Mission',
        defaults: {
            name: 'Kernel Search',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'kernalApiAuthApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Search Query',
                name: 'query',
                type: 'string',
                default: '',
                description: 'Search query text',
            },
            {
                displayName: 'Sector',
                name: 'sector',
                type: 'options',
                default: '',
                description: 'Filter by sector. Choose from the list.',
                typeOptions: {
                    loadOptionsMethod: 'getSectors',
                },

            },
            {
                displayName: 'Industry',
                name: 'industry',
                type: 'options',
                default: '',
                description: 'Filter by industry. Choose from the list.',
                typeOptions: {
                    loadOptionsMethod: 'getIndustries',
                    loadOptionsDependsOn: ['sector'],
                },

            },
            {
                displayName: 'Technology',
                name: 'technology',
                type: 'options',
                default: '',
                description: 'Filter by technology. Choose from the list.',
                typeOptions: {
                    loadOptionsMethod: 'getTechnologies',
                },

            },
            {
                displayName: 'Business Model',
                name: 'business_model',
                type: 'options',
                default: '',
                description: 'Filter by business model. Choose from the list.',
                typeOptions: {
                    loadOptionsMethod: 'getBusinessModels',
                },

            },
            
            {
                displayName: 'State',
                name: 'state',
                type: 'options',
                default: '',
                description: 'Filter by state. Choose from the list.',
                typeOptions: {
                    loadOptionsMethod: 'getStates',
                },

            },
            {
                displayName: 'District',
                name: 'district',
                type: 'options',
                default: '',
                description: 'Filter by district. Choose from the list.',
                typeOptions: {
                    loadOptionsMethod: 'getDistricts',
                    loadOptionsDependsOn: ['state'],
                },

            },

            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
				typeOptions: {
					minValue: 1,
				},
                default: 50,
                description: 'Max number of results to return',
            },
        ],
        usableAsTool: true
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        const credentials = await this.getCredentials('kernalApiAuthApi');
        if (!credentials) {
            throw new NodeOperationError(this.getNode(), 'Missing API credentials.');
        }

        for (let i = 0; i < items.length; i++) {
            try {
                const query = this.getNodeParameter('query', i) as string;
                const sector = this.getNodeParameter('sector', i, '') as string;
                const industry = this.getNodeParameter('industry', i, '') as string;
                const technology = this.getNodeParameter('technology', i, '') as string;
                const businessModel = this.getNodeParameter('business_model', i, '') as string;
                const state = this.getNodeParameter('state', i, '') as string;
                const district = this.getNodeParameter('district', i, '') as string;
                const limit = this.getNodeParameter('limit', i) as number;

                const body: Record<string, any> = { query };
                if (sector) body.sector = sector;
                if (industry) body.industry = industry;
                if (technology) body.technology = technology;
                if (businessModel) body.business_model = businessModel;
                if (state) body.state = state;
                if (district) body.district = district;
                if (limit) body.limit = limit;

                const headers = {
                    'x-auth-key': credentials.authKey,
                    'x-auth-secret': credentials.authSecret,
                };

                const response = await this.helpers.request({
                    method: 'POST',
                    url: 'https://startups.startupmission.in/api/v1/startup/search',
                    headers,
                    body,
                    json: true,
                });

                returnData.push(...response.map((data: any) => ({ json: data })));
            } catch (error) {
                throw new NodeApiError(this.getNode(), error);
            }
        }

        return [returnData];
    }

    methods = {
        loadOptions: {
            async getSectors(this: ILoadOptionsFunctions) {
                return KernalSearch.fetchMetadataOptions.call(this, 'sector');
            },
            async getIndustries(this: ILoadOptionsFunctions) {
                const sector = this.getCurrentNodeParameter('sector') as string;
                return KernalSearch.fetchMetadataOptions.call(this, 'industry', sector ? { filter: sector } : {});
            },
            async getTechnologies(this: ILoadOptionsFunctions) {
                return KernalSearch.fetchMetadataOptions.call(this, 'technology');
            },
            async getBusinessModels(this: ILoadOptionsFunctions) {
                return KernalSearch.fetchMetadataOptions.call(this, 'business_model');
            },
            async getStates(this: ILoadOptionsFunctions) {
                return KernalSearch.fetchMetadataOptions.call(this, 'state');
            },
            async getDistricts(this: ILoadOptionsFunctions) {
                const state = this.getCurrentNodeParameter('state') as string;
                return KernalSearch.fetchMetadataOptions.call(this, 'district', state ? { filter: state } : {});
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
