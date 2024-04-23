import { HTTPRequest, Traffic } from '@kapeta/ui-web-types';

type CreateTrafficOptions = {
    providerMethodId: string;
    consumerMethodId: string;
    timestamp: number;
    duration?: number;
    request?: {
        headers?: HTTPRequest['headers'];
        body?: string;
        url?: string;
        method?: string;
    };
    response?: {
        headers?: HTTPRequest['headers'];
        code?: number;
        body?: string;
    };
    error?: string;
};

export const createTraffic = (options: CreateTrafficOptions) => {
    const { providerMethodId, consumerMethodId, timestamp, duration = 246, request, response, error } = options;
    return {
        id: Math.random().toString(26).slice(2, 12),
        connectionId: Math.random().toString(26).slice(2, 12),
        providerMethodId,
        consumerMethodId,
        ended: timestamp,
        created: timestamp - duration,
        request: {
            headers: request?.headers || {},
            body: request?.body || '',
            url: request?.url || '/some/where',
            method: request?.method || 'GET',
        },
        response: {
            headers: response?.headers || {},
            code: response?.code || 200,
            body: response?.body || '',
        },
        error: error || '',
    } satisfies Traffic;
};

const bigRequestHeaders = {
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
};

const getBigResponseHeaders = (contentLength: number) => ({
    'x-powered-by': 'Express',
    'content-type': 'application/json; charset=utf-8',
    'content-length': `${contentLength}`,
    etag: 'W/"a0-tByXetiJPiPI3/BxjLTmmTCZyW4"',
    date: 'Tue, 16 Apr 2024 10:09:25 GMT',
    connection: 'close',
});

export const addMessageSuccess = createTraffic({
    providerMethodId: 'addMessage',
    consumerMethodId: 'remoteAddMessage',
    timestamp: Date.now(),
    request: {
        method: 'POST',
        url: '/messages',
        body: `{"author": "johndoe", "content": "Hello World", "sentAt": ${Date.now()}}`,
        headers: bigRequestHeaders,
    },
    response: {
        code: 200,
        headers: getBigResponseHeaders(2345),
        body: `{ "id": "1234", "author": { "userId": "johndoe", "name": "John Doe", "email": "johndoe@example.com", "profilePicture": "https://example.com/path/to/image.jpg", "status": "online" }, "content": "Hello World", "metadata": { "contentType": "text/plain", "contentLength": 11, "tags": ["greeting", "introductory"], "language": "en" }, "status": { "delivered": true, "read": false, "archived": false }, "sentAt": "${Date.now()}" }`,
    },
});

export const addMessageUnauthorized = createTraffic({
    providerMethodId: 'addMessage',
    consumerMethodId: 'remoteAddMessage',
    timestamp: Date.now() - 2000,
    duration: 123,
    request: {
        method: 'POST',
        url: '/messages',
        body: `{"author": "johndoe", "content": "Hello World", "sentAt": ${Date.now() - 2000}}`,
        headers: bigRequestHeaders,
    },
    response: {
        code: 401,
        headers: getBigResponseHeaders(0),
        body: '',
    },
});

export const addMessageServerError = createTraffic({
    providerMethodId: 'addMessage',
    consumerMethodId: 'remoteAddMessage',
    timestamp: Date.now() - 3500,
    duration: 523,
    request: {
        method: 'POST',
        url: '/messages',
        body: `{"author": "johndoe", "content": "Hello World", "sentAt": ${Date.now() - 3500}}`,
        headers: bigRequestHeaders,
    },
    response: {
        code: 500,
        headers: getBigResponseHeaders(123),
        body: '{"error": "Internal Server Error"}',
    },
});

export const getUsersSuccess = createTraffic({
    providerMethodId: 'getUsers',
    consumerMethodId: 'remoteGetUsers',
    timestamp: Date.now() - 7654,
    duration: 413,
    request: {
        method: 'GET',
        url: '/users',
        headers: bigRequestHeaders,
    },
    response: {
        code: 200,
        headers: getBigResponseHeaders(5213),
        body: `[
            { "userId": "johndoe", "name": "John Doe", "email": "john.doe@hotmail.com", "profilePicture": "https://example.com/path/to/image.jpg", "status": "online" }, 
            { "userId": "janedoe", "name": "Jane Doe", "email": "jane.doe@gmail.com", "profilePicture": "https://example.com/path/to/image.jpg", "status": "offline" }
        ]`,
    },
});

export const getUsersNotFound = createTraffic({
    providerMethodId: 'getUsers',
    consumerMethodId: 'remoteGetUsers',
    timestamp: Date.now(),
    duration: 22,
    request: {
        method: 'GET',
        url: '/users',
        headers: bigRequestHeaders,
    },
    response: {
        code: 404,
        headers: getBigResponseHeaders(0),
        body: '',
    },
});
