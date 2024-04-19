/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { Box, useTheme } from '@mui/material';
import React from 'react';
import { getHttpStatusCodeColor } from '../helpers';

export interface PayloadStatusDotProps {
    code: number;
}

export const PayloadStatusDot = (props: PayloadStatusDotProps) => {
    const { code } = props;

    const { palette } = useTheme();

    return (
        <Box
            sx={{
                display: 'block',
                width: '14px',
                height: '14px',
                minWidth: '14px',
                minHeight: '14px',
                m: '3px',
                borderRadius: '50%',
                backgroundColor: code ? getHttpStatusCodeColor(code, palette) : palette.divider,
            }}
        />
    );
};
