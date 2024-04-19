/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Box, Stack, SxProps } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export type Breadcrumb = {
    name: string;
    onClick?: () => void;
};

interface InspectConnectionBreadcrumbsProps {
    breadcrumbs: Breadcrumb[];
}

export const InspectConnectionBreadcrumbs = (props: InspectConnectionBreadcrumbsProps) => {
    const { breadcrumbs } = props;

    if (breadcrumbs.length < 2) {
        return null;
    }

    return (
        <Stack
            direction="row"
            sx={{ mb: 2, gap: 0.5 }}
            divider={<NavigateNextIcon fontSize="small" color="disabled" />}
        >
            {breadcrumbs.map((breadcrumb, index) => {
                const isLast = index === breadcrumbs.length - 1;

                // Last breadcrumb should not be clickable as it is the current page
                const onClick = isLast ? undefined : breadcrumb.onClick;

                const hoverStyle: SxProps = isLast
                    ? {}
                    : {
                          '&:hover': {
                              cursor: 'pointer',
                              textDecoration: 'underline',
                          },
                      };

                return (
                    <Box
                        key={index}
                        component={'span'}
                        sx={{
                            fontSize: '0.875rem',
                            textDecoration: 'none',
                            ...hoverStyle,
                        }}
                        onClick={onClick}
                    >
                        {breadcrumb.name}
                    </Box>
                );
            })}
        </Stack>
    );
};
