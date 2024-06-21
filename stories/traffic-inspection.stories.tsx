/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { ConnectionMethodsMapping, ConnectionMethodMappingType, Traffic } from '@kapeta/ui-web-types';
import { InspectConnectionContent } from '../src/web/inspectors/InspectConnectionContent';
import './stories.less';
import {
    addMessageSuccess,
    addMessageUnauthorized,
    addMessageServerError,
    getUsersSuccess,
    getUsersNotFound,
    createTraffic,
} from './trafficDataGenerator';
import { ThemedStoryWrapper } from './utils';

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

const trafficLines: Traffic[] = [
    addMessageSuccess,
    addMessageUnauthorized,
    addMessageServerError,
    getUsersSuccess,
    getUsersNotFound,
];

export default {
    title: 'Traffic Inspection',
};

export const TrafficInspectorView = () => (
    <ThemedStoryWrapper sx={{ flex: 1 }}>
        <InspectConnectionContent mapping={mapping} trafficLines={trafficLines} />
    </ThemedStoryWrapper>
);

export const WhileRequestsAreArriving = () => {
    const [traffic, setTraffic] = React.useState<Traffic[]>([]);

    const providerMethodId = 'addMessage';
    const consumerMethodId = 'remoteAddMessage';

    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        const addTraffic = () => {
            setTraffic((prevTraffic) => {
                const newTraffic = createTraffic({
                    providerMethodId,
                    consumerMethodId,
                    timestamp: Date.now(),
                    duration: Math.floor(Math.random() * 980) + 20, // Between 20 ms and 1000 ms
                    request: {
                        method: 'POST',
                        url: '/messages',
                        body: `{"author": "johndoe", "content": "Hello World"}`,
                        headers: {
                            'content-type': 'application/json',
                            Authorization: 'Bearer 123456',
                        },
                    },
                    response: {
                        code: 200,
                        headers: {
                            'content-type': 'application/json',
                            'content-length': Math.floor(Math.random() * 10000).toString(),
                        },
                        body: `{ "messageId": "${Math.random()
                            .toString(26)
                            .slice(2, 12)}", "author": "johndoe", "content": "Hello World", "sentAt": ${Date.now()}}`,
                    },
                });
                return [...prevTraffic, newTraffic];
            });

            // Schedule the next traffic addition at a random interval between
            const nextInterval = Math.floor(Math.random() * 500) + 200;
            timer = setTimeout(addTraffic, nextInterval);
        };

        // Start the process
        addTraffic();

        return () => clearTimeout(timer);
    }, []);

    return (
        <ThemedStoryWrapper sx={{ flex: 1 }}>
            <InspectConnectionContent mapping={mapping} trafficLines={traffic} />
        </ThemedStoryWrapper>
    );
};
