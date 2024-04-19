/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { JSONTree } from 'react-json-tree';
import { usePayloadAccordionContext } from './PayloadAccordionContext';
import { withErrorBoundary } from 'react-error-boundary';
import { NoValue } from '../helpers';

export interface PayloadPreviewProps {
    contentType: string | undefined;
    data: string | undefined;
    emptyMessage?: string;
}

const jsonTreeTheme = {
    base00: '#ffffff',
    base01: '#303030',
    base02: '#505050',
    base03: '#b0b0b0',
    base04: '#d0d0d0',
    base05: '#e0e0e0',
    base06: '#f5f5f5',
    base07: '#ffffff',
    base08: '#fb0120',
    base09: '#fc6d24',
    base0A: '#fda331',
    base0B: '#000000de',
    base0C: '#76c7b7',
    base0D: '#1976d2',
    base0E: '#d381c3',
    base0F: '#be643c',
};

const prettifyJson = (value: string | undefined) => {
    try {
        return JSON.stringify(JSON.parse(value || ''), null, 2);
    } catch (e) {
        return value;
    }
};

const renderRawText = (value: string | undefined) => {
    return value ? (
        <Typography
            variant="body2"
            sx={{
                fontFamily: 'monospace',
                whiteSpace: 'pre',
                fontSize: '0.75rem',
            }}
        >
            {value}
        </Typography>
    ) : null;
};

const renderJson = (value: string | undefined) => {
    try {
        const jsObj = JSON.parse(value || '') as unknown;
        return (
            <Box
                sx={{
                    fontSize: '0.75rem',
                    '& > ul': {
                        m: '0 !important',
                        '& > li': {
                            position: 'unset !important',
                        },
                    },
                    ml: '-14px',
                }}
            >
                <JSONTree
                    data={jsObj}
                    theme={jsonTreeTheme}
                    hideRoot
                    labelRenderer={([key]) => <strong>{key}</strong>}
                    shouldExpandNodeInitially={(_keyPath, _data, level) => level < 2}
                />
            </Box>
        );
    } catch (e) {
        return renderRawText(value);
    }
};

export const PayloadPreview = withErrorBoundary(
    (props: PayloadPreviewProps) => {
        const { contentType, data, emptyMessage } = props;

        const { raw } = usePayloadAccordionContext();

        /**
         * Render preview based on content type
         */
        let preview = null;
        switch (contentType) {
            case 'application/json': {
                preview = raw ? renderRawText(prettifyJson(data)) : renderJson(data);
                break;
            }
            case 'application/xml':
            case 'text/xml':
            case 'application/javascript':
            case 'text/javascript':
            case 'text/ecmascript':
            case 'text/html':
            case 'text/plain':
            case 'text/csv':
            case 'text/css': {
                preview = renderRawText(data);
                break;
            }

            default:
                preview = contentType
                    ? `Preview of payload with content type: "${contentType}" is not supported`
                    : 'Preview of this payload is not supported';
        }

        return data ? preview : <NoValue text={emptyMessage || 'No payload'} />;
    },
    {
        // The error boundary will catch errors and display this fallback UI
        fallback: <NoValue text="Failed to preview payload" />,
    }
);
