/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { httpStatusPhrase } from '@kapeta/ui-web-utils';
import { getHttpStatusCodeColor } from '../helpers';

export interface RequestStatusCodeProps {
    code: number | undefined;
}

export const RequestStatusCode = (props: RequestStatusCodeProps) => {
    const { code } = props;

    const { palette } = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
            }}
        >
            <Box
                sx={{
                    display: 'inline-block',
                    color: '#ffffff',
                    backgroundColor: code ? getHttpStatusCodeColor(code, palette) : palette.divider,
                    padding: '1px 4px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem',
                }}
            >
                {code ? code : <CircularProgress size={14} />}
            </Box>
            <Typography variant="body2" fontSize={'0.75rem'}>
                {httpStatusPhrase(code || 0)}
            </Typography>
        </Box>
    );
};
