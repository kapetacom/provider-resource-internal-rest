/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { Box, BoxProps, IconButton, useTheme } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Tooltip } from '@kapeta/ui-web-components';

type TooltipColor = 'normal' | 'success';

export interface PayloadCopyButtonProps extends BoxProps {
    /**
     * The data to be copied
     */
    data: string | undefined;
    /**
     * Callback when the copy action is successful
     */
    onCopyData?: (value?: string) => void;
    /**
     * Callback when the copy action failed
     */
    onCopyDataFailed?: (event: ErrorEvent) => void;
    /**
     * Tooltip text to show before copying
     * @default 'Copy'
     */
    preCopyTooltipText?: string;
    /**
     * Color of tooltip before copying
     * @default 'normal'
     */
    preCopyTooltipColor?: TooltipColor;
    /**
     * Tooltip text to show after copying
     * @default 'Copied'
     */
    postCopyTooltipText?: string;
    /**
     * Color of tooltip after copying
     * @default 'success'
     */
    postCopyTooltipColor?: TooltipColor;
    /**
     * If the copy button is disabled
     * @default false
     */
    disabled?: boolean;
}

export const PayloadCopyButton = (props: PayloadCopyButtonProps) => {
    const {
        data,
        onCopyData,
        onCopyDataFailed,
        preCopyTooltipText = 'Copy',
        preCopyTooltipColor = 'normal',
        postCopyTooltipText = 'Copied',
        postCopyTooltipColor = 'success',
        disabled = false,
        ...boxProps
    } = props;

    const [tooltipText, setTooltipText] = useState(preCopyTooltipText);
    const [tooltipColor, setTooltipColor] = useState(preCopyTooltipColor);

    const { palette } = useTheme();

    const colorMap: Record<TooltipColor, { backgroundColor?: string; color?: string }> = useMemo(
        () => ({
            normal: {}, // no overrides
            success: { backgroundColor: palette.success.light, color: '#ffffff' },
        }),
        [palette]
    );

    const triggerCopy: MouseEventHandler = useCallback(
        (event) => {
            // Do not propagate the event to the parent elements (e.g. when in an accordion summary
            // we don't want to expand/collapse the accordion)
            event.stopPropagation();

            if (!data) {
                console.warn('No data to copy');
                return;
            }

            navigator.clipboard
                .writeText(data)
                .then(() => {
                    if (onCopyData) {
                        onCopyData(data);
                    }
                    setTooltipColor(postCopyTooltipColor);
                    setTooltipText(postCopyTooltipText);
                })
                .catch((error: ErrorEvent) => {
                    if (onCopyDataFailed) {
                        onCopyDataFailed(error);
                    }
                });
        },
        [data, onCopyData, onCopyDataFailed, postCopyTooltipColor, postCopyTooltipText]
    );

    const resetTooltip = () => {
        setTimeout(() => {
            setTooltipColor(preCopyTooltipColor);
            setTooltipText(preCopyTooltipText);
        }, 600);
    };

    return (
        <Box {...boxProps}>
            <Tooltip
                title={tooltipText}
                placement="top"
                backgroundColor={colorMap[tooltipColor].backgroundColor}
                color={colorMap[tooltipColor].color}
            >
                <IconButton
                    aria-label="Copy"
                    size="small"
                    sx={{ mr: -1 }}
                    onClick={triggerCopy}
                    onMouseLeave={resetTooltip}
                    disabled={disabled}
                >
                    <ContentCopyIcon fontSize="small" sx={{ fontSize: 14 }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
};
