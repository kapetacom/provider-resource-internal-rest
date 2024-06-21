/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Stack, SxProps, Typography } from '@mui/material';
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
                    <Typography
                        key={index}
                        variant="body2"
                        color="text.primary"
                        sx={(theme) => ({
                            display: 'inline-block',
                            fontSize: '0.875rem',
                            '&:focus': {
                                color: theme.palette.mode === 'dark' ? 'text.primary' : 'primary.main',
                            },
                            ...hoverStyle,
                        })}
                        onClick={onClick}
                        // Accessibility
                        role="button"
                        tabIndex={isLast ? undefined : 0}
                        onKeyUp={(event) => {
                            if ((event.key === 'Enter' || event.key === ' ') && onClick) {
                                onClick();
                            }
                        }}
                        aria-current={isLast ? 'page' : undefined}
                    >
                        {breadcrumb.name}
                    </Typography>
                );
            })}
        </Stack>
    );
};
