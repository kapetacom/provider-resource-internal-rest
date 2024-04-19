/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { ReactNode } from 'react';
import { AccordionDetails, AccordionProps, Accordion, AccordionSummary, styled, Box, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { PayloadCopyButton } from './PayloadCopyButton';
import { PayloadRawSwitch } from './PayloadPreviewRawSwitch';
import { PayloadAccordionContextProvider } from './PayloadAccordionContext';

const StyledAccordion = styled((props: AccordionProps) => <Accordion disableGutters elevation={0} square {...props} />)(
    () => ({
        '&:not(:last-child)': {
            borderBottom: 0,
        },
        '&::before': {
            display: 'none',
        },
    })
);

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
    '&.MuiAccordionSummary-root': {
        gap: theme.spacing(2),
        border: `1px solid ${theme.palette.divider}`,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        minHeight: theme.spacing(4),
        padding: theme.spacing(0, 2),
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
        order: 1,
        '&.Mui-expanded': {
            transform: 'rotate(90deg)',
        },
    },
    '& .MuiAccordionSummary-content': {
        order: 2,
        margin: 0,
    },
}));

interface PayloadAccordionProps extends AccordionProps {
    /**
     * The summary of the accordion (the header of the accordion)
     */
    summary: ReactNode;
    /**
     * The data that will be displayed in the accordion. If `canCopy` is enabled, this will be
     * copied when the copy button is clicked
     */
    data?: string;
    /**
     * Whether to show the raw toggle
     * @default false
     */
    showRawToggle?: boolean;
    /**
     * Whether to show the copy button
     * @default false
     */
    showCopyButton?: boolean;
    /**
     * If the copy button is enabled
     */
    canCopy?: boolean;
    /**
     * Callback when the copy action is successful
     */
    onCopyData?: (value?: string) => void;
    /**
     * Callback when the copy action failed
     */
    onCopyDataFailed?: (event: ErrorEvent) => void;
}

export const PayloadAccordion = (props: PayloadAccordionProps) => {
    const {
        summary,
        data,
        showRawToggle = false,
        showCopyButton = false,
        canCopy,
        onCopyData,
        onCopyDataFailed,
        children,
        ...accordionProps
    } = props;

    const renderSummary = () => {
        return typeof summary === 'string' ? (
            <Typography variant="body2" fontSize={'0.75rem'}>
                <Box component="span" fontWeight={600}>
                    {summary}
                </Box>
            </Typography>
        ) : (
            summary
        );
    };

    return (
        <PayloadAccordionContextProvider>
            <StyledAccordion
                {...accordionProps}
                sx={{
                    '&:hover': {
                        '.payload-toolbar': {
                            // Fade in the toolbar when the accordion is hovered
                            opacity: 1,
                        },
                    },
                }}
            >
                <StyledAccordionSummary
                    expandIcon={<ChevronRightIcon fontSize="small" />}
                    aria-controls="panel1-content"
                    sx={{
                        px: 2,
                        py: 1,
                        '&:hover': {
                            backgroundColor: '#f5f5f5',
                        },
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            width: '100%',
                        }}
                    >
                        {renderSummary()}
                        <Box
                            className="payload-toolbar"
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                gap: 1,
                                // Fade out the toolbar when the accordion is not hovered
                                opacity: 0.3,
                                transition: 'opacity 0.2s ease-in-out',
                            }}
                        >
                            {showRawToggle && <PayloadRawSwitch disabled={!data} />}
                            {showCopyButton && (
                                <PayloadCopyButton
                                    data={data}
                                    disabled={!canCopy}
                                    onCopyData={onCopyData}
                                    onCopyDataFailed={onCopyDataFailed}
                                />
                            )}
                        </Box>
                    </Box>
                </StyledAccordionSummary>
                <AccordionDetails sx={{ overflow: 'auto' }}>{children}</AccordionDetails>
            </StyledAccordion>
        </PayloadAccordionContextProvider>
    );
};
