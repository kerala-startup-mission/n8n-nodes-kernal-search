import {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class KernalApiAuthApi implements ICredentialType {
    name = 'kernalApiAuthApi';
    displayName = 'Kernal API Authentication API';
    documentationUrl = 'https://startups.startupmission.in/';
    properties: INodeProperties[] = [
        {
            displayName: 'Auth Key',
            name: 'authKey',
            type: 'string',
			typeOptions: { password: true },
            default: '',
        },
        {
            displayName: 'Auth Secret',
            name: 'authSecret',
            type: 'string',
			typeOptions: { password: true },
            default: '',
        },
    ];
}