/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { JSONTree } from 'react-json-tree';
import { usePayloadAccordionContext } from './PayloadAccordionContext';
import { withErrorBoundary } from 'react-error-boundary';
import { NoValue } from '../helpers';
import { useNiceScrollbars } from '@kapeta/ui-web-components';

export interface PayloadPreviewProps {
    contentType: string | undefined;
    data: string | undefined;
    emptyMessage?: string;
}

const jsonTreeTheme = {
    base00: 'transparent',
    base01: '#383830',
    base02: '#49483e',
    base03: '#75715e',
    base04: '#a59f85',
    base05: '#f8f8f2',
    base06: '#f5f4f1',
    base07: '#f9f8f5',
    base08: '#f92672',
    base09: '#fd971f',
    base0A: '#f4bf75',
    base0B: '#a6e22e',
    base0C: '#a1efe4',
    base0D: '#66d9ef',
    base0E: '#ae81ff',
    base0F: '#cc6633',
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
            sx={(theme) => ({
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                fontSize: '0.75rem',
                overflow: 'auto',
                ...useNiceScrollbars(theme.palette.background.paper),
            })}
        >
            {value}
        </Typography>
    ) : null;
};

const renderJson = (value: string | undefined, isDarkMode = false) => {
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
                    invertTheme={isDarkMode}
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

        const isDarkMode = useTheme().palette.mode === 'dark';

        /**
         * Render preview based on content type
         */
        let preview = null;
        switch (contentType) {
            case 'application/json': {
                preview = raw ? renderRawText(prettifyJson(data)) : renderJson(data, !isDarkMode);
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
