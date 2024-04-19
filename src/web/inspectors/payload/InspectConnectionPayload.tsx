/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { httpStatusPhrase } from '@kapeta/ui-web-utils';
import { Traffic } from '@kapeta/ui-web-types';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { PayloadPreview } from './PayloadPreview';
import { asByte, getContentType } from '../helpers';
import { useUserAgent } from '@kapeta/ui-web-components';
import { PayloadKeyValueList } from './PayloadKeyValueList';
import { PayloadAccordion } from './PayloadAccordion';
import { PayloadStatusDot } from './PayloadStatusDot';
import { PayloadCopyButton } from './PayloadCopyButton';

interface InspectTrafficPayloadProps {
    traffic: Traffic;
}

export const InspectConnectionPayload = (props: InspectTrafficPayloadProps) => {
    const { traffic } = props;
    const { request, response } = traffic;

    const userAgent = useUserAgent(request.headers['user-agent']);
    const browser = userAgent?.browser?.name || '-';
    const browserVersion = userAgent?.browser?.version || '-';
    const os = userAgent?.os?.name || '-';

    const renderRequestSummary = () => {
        return (
            <PayloadAccordion
                summary={
                    <Typography variant="body2" fontSize={'0.75rem'}>
                        <Box component="span" fontWeight={600}>
                            {request.method}
                        </Box>
                        <Box component="span" ml={1}>
                            {request.url}
                        </Box>
                    </Typography>
                }
                defaultExpanded
            >
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'cemter', alignItems: 'center', mb: 1 }}>
                    <PayloadStatusDot code={response?.code || 0} />
                    <Typography variant="body2" fontWeight={600} fontSize={'0.75rem'}>
                        Status: {response ? `${response.code} ${httpStatusPhrase(response?.code)}` : 'Pending'}
                    </Typography>
                </Box>
                <Box sx={{ ml: '36px' }}>
                    <PayloadKeyValueList
                        map={{
                            Transferred: asByte(traffic),
                            Browser: `${browser} ${browserVersion}`,
                            OS: os,
                        }}
                        emptyMessage="Content size is not available"
                    />
                </Box>
            </PayloadAccordion>
        );
    };

    const renderRequestHeaders = () => {
        const data = request.headers;
        return (
            <PayloadAccordion
                summary="Request Headers"
                data={JSON.stringify(data)}
                showCopyButton
                canCopy={!!data}
                defaultExpanded={false} // Default to collapsed
            >
                <Box sx={{ ml: '36px' }}>
                    <PayloadKeyValueList map={request.headers} emptyMessage="No headers available" />
                </Box>
            </PayloadAccordion>
        );
    };

    const renderResponseHeaders = () => {
        const data = response?.headers;
        return (
            <PayloadAccordion
                summary="Response Headers"
                data={JSON.stringify(data)}
                showCopyButton
                canCopy={!!data}
                defaultExpanded={false} // Default to collapsed
            >
                <Box sx={{ ml: '36px' }}>
                    <PayloadKeyValueList map={response?.headers ?? {}} emptyMessage="No headers available" />
                </Box>
            </PayloadAccordion>
        );
    };

    const renderRequestPayload = () => {
        const data = request.body;
        return (
            <PayloadAccordion
                summary="Request Payload"
                data={data}
                showRawToggle
                showCopyButton
                canCopy={!!data}
                defaultExpanded
            >
                <Box sx={{ ml: '36px' }}>
                    <PayloadPreview contentType={getContentType(request.headers)} data={data} />
                </Box>
            </PayloadAccordion>
        );
    };

    const renderResponsePayload = () => {
        const data = response?.body;
        return (
            <PayloadAccordion
                summary={
                    <Typography variant="body2" fontSize={'0.75rem'}>
                        <Box component="span" fontWeight={600}>
                            Response Payload
                        </Box>
                    </Typography>
                }
                data={data}
                showRawToggle
                showCopyButton
                canCopy={!!data}
                defaultExpanded
            >
                <Box sx={{ ml: '36px' }}>
                    <PayloadPreview contentType={getContentType(response?.headers || {})} data={data} />
                </Box>
            </PayloadAccordion>
        );
    };

    return (
        <Box sx={{ position: 'relative' }}>
            <PayloadCopyButton
                data={JSON.stringify({
                    requestAt: new Date(traffic.created),
                    responseAt: new Date(traffic.ended),
                    error: traffic.error,
                    request: traffic.request,
                    response: traffic.response,
                })}
                sx={{ position: 'absolute', right: '15px', top: '-30px' }}
            />

            <Box sx={{ mb: '-1px' }}>{renderRequestSummary()}</Box>

            <Stack
                direction="row"
                sx={{ mb: '-1px', '&>div': { flex: 1, overflow: 'hidden' } }}
                divider={<Divider orientation="vertical" flexItem />}
            >
                {renderRequestHeaders()}
                {renderResponseHeaders()}
            </Stack>

            <Stack
                direction="row"
                sx={{ '&>div': { flex: 1, overflow: 'hidden' } }}
                divider={<Divider orientation="vertical" flexItem />}
            >
                {renderRequestPayload()}
                {renderResponsePayload()}
            </Stack>
        </Box>
    );
};
