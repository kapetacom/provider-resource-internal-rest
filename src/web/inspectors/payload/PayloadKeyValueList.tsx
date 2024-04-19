/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { ReactNode } from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { NoValue } from '../helpers';

export interface PayloadKeyValueListProps {
    map: Record<string, ReactNode>;
    emptyMessage?: string;
}

export const PayloadKeyValueList = (props: PayloadKeyValueListProps) => {
    const { map, emptyMessage } = props;

    const mapHasData = Object.keys(map).length > 0;

    return mapHasData ? (
        <List sx={{ p: 0 }}>
            {Object.entries(map).map(([key, value]) => (
                <ListItem key={key} sx={{ p: 0, m: 0 }}>
                    <ListItemText sx={{ m: 0 }}>
                        <Typography variant="body2" fontSize={'0.75rem'} sx={{ lineBreak: 'anywhere' }}>
                            <Typography
                                variant="body2"
                                fontSize={'0.75rem'}
                                component="span"
                                fontWeight={600}
                                color="primary"
                            >
                                {key}
                            </Typography>
                            : {value}
                        </Typography>
                    </ListItemText>
                </ListItem>
            ))}
        </List>
    ) : (
        <NoValue text={emptyMessage || 'No data available'} />
    );
};
