import React from 'react';
import { ConnectionMethodsMapping, ConnectionMethodMappingType, Traffic } from '@kapeta/ui-web-types';
import { InspectConnectionContent } from '../src/web/inspectors/InspectConnectionContent';
import './stories.less';

const mapping: ConnectionMethodsMapping = {
    addMessage: {
        targetId: 'remoteAddMessage',
        type: ConnectionMethodMappingType.EXACT,
    },
    getUsers: {
        targetId: 'remoteGetUsers',
        type: ConnectionMethodMappingType.EXACT,
    },
};

const now = new Date().getTime();

const trafficLines: Traffic[] = [
    {
        ended: now,
        connectionId: '1',
        consumerMethodId: 'remoteAddMessage',
        created: now - 123,
        id: '1',
        providerMethodId: 'addMessage',
        error: '',
        request: {
            headers: {
                'content-type': 'application/json',
                'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
                accept: 'application/json',
                dnt: '1',
                'sec-ch-ua-mobile': '?0',
                'user-agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                referer: 'http://127.0.0.1:40024/',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-GB,en;q=0.9',
                'if-none-match': 'W/"a0-tByXetiJPiPI3/BxjLTmmTCZyW4"',
                'accept-charset': 'utf-8',
                'sentry-trace': 'a9a976d7976846e6a5bfeb15168fc9b0-91c32ebfa69e524f-0',
                baggage:
                    'sentry-environment=production,sentry-public_key=0b7cc946d82c591473d6f95fff5e210b,sentry-trace_id=a9a976d7976846e6a5bfeb15168fc9b0,sentry-sample_rate=0.05,sentry-transaction=GET%20%2Fproxy%2Fkapeta%253A%252F%252Fharald_andertun%252Fgreen-mango%253Alocal%2F40c4e346-633f-4618-bf6c-c4b794815ed1%2Fmain%2Fweb%2Fapi%2Frest%2Fmangos%2Fmangos,sentry-sampled=false',
            },
            body: `{"author": "johndoe", "content": "Hello World", "sentAt": ${now}}`,
            url: '/messages',
            method: 'POST',
        },
        response: {
            code: 200,
            headers: {
                'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2315',
                etag: 'W/"a0-tByXetiJPiPI3/BxjLTmmTCZyW4"',
                date: 'Tue, 16 Apr 2024 10:09:25 GMT',
                connection: 'close',
            },
            body: `{ "id": "1234", "author": { "userId": "johndoe", "name": "John Doe", "email": "johndoe@example.com", "profilePicture": "https://example.com/path/to/image.jpg", "status": "online" }, "content": "Hello World", "metadata": { "contentType": "text/plain", "contentLength": 11, "tags": ["greeting", "introductory"], "language": "en" }, "status": { "delivered": true, "read": false, "archived": false }, "sentAt": "${now}" }`,
        },
    },
    {
        ended: now,
        connectionId: '1',
        consumerMethodId: 'remoteAddMessage',
        created: now - 2345,
        id: '2',
        providerMethodId: 'addMessage',
        error: '',
        request: {
            headers: {},
            body: '',
            url: '/some/where',
            method: 'POST',
        },
        response: {
            code: 200,
            headers: {},
        },
    },
    {
        ended: now,
        connectionId: '1',
        consumerMethodId: 'remoteAddMessage',
        created: now - 3456,
        id: '3',
        providerMethodId: 'addMessage',
        error: '',
        request: {
            headers: {},
            body: '',
            url: '/some/where',
            method: 'POST',
        },
        response: {
            code: 503,
            headers: {},
        },
    },
    {
        ended: now,
        connectionId: '1',
        consumerMethodId: 'remoteGetUsers',
        created: now - 4567,
        id: '4',
        providerMethodId: 'getUsers',
        error: '',
        request: {
            headers: {},
            body: '',
            url: '/some/where',
            method: 'POST',
        },
        response: {
            code: 200,
            headers: {
                'content-type': 'application/json',
            },
            body: '[{"id": "1234"}, {"id": "1235"}, {"id": "1236"}, {"id": "1237"}]',
        },
    },
];

export default {
    title: 'Traffic Inspection',
};

export const TrafficInspectorView = () => <InspectConnectionContent mapping={mapping} trafficLines={trafficLines} />;
