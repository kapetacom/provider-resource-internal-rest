/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Box, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { HitsCounter } from './HitsCounter';
import { ConnectionMethod } from '../types';

interface InspectConnectionProps {
    methods: ConnectionMethod[];
    onMethodClick: (method: string) => void;
}

export const InspectConnectionMethods = (props: InspectConnectionProps) => {
    const { methods, onMethodClick } = props;

    return (
        <Box>
            <Table size="small" aria-label={`Methods on the connection`}>
                <TableHead
                    sx={{
                        '.MuiTableCell-head': {
                            fontWeight: 500,
                        },
                    }}
                >
                    <TableRow>
                        <TableCell>Provider</TableCell>
                        <TableCell sx={{ px: 0 }}>{/* Arrow column */}</TableCell>
                        <TableCell>Consumer</TableCell>
                        <TableCell align="right">Hits</TableCell>
                        <TableCell align="right">2xx</TableCell>
                        <TableCell align="right">3xx</TableCell>
                        <TableCell align="right">4xx</TableCell>
                        <TableCell align="right">5xx</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {methods.map((method, index) => {
                        return (
                            <TableRow
                                key={`${method.providerName}-${method.consumerName}`}
                                onClick={() => onMethodClick(method.providerName)}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: '#f5f5f5',
                                    },
                                }}
                            >
                                <TableCell>{method.providerName}</TableCell>
                                <TableCell sx={{ px: 0 }}>
                                    <Box component="i" className="fal fa-long-arrow-right" />
                                </TableCell>
                                <TableCell sx={{ position: 'relative' }}>{method.consumerName}</TableCell>
                                <TableCell align="right">
                                    <HitsCounter hits={method.stats.requests} statusCode={100} />
                                </TableCell>
                                <TableCell align="right">
                                    <HitsCounter hits={method.stats.sc2xx} statusCode={200} />
                                </TableCell>
                                <TableCell align="right">
                                    <HitsCounter hits={method.stats.sc3xx} statusCode={300} />
                                </TableCell>
                                <TableCell align="right">
                                    <HitsCounter hits={method.stats.sc4xx} statusCode={400} />
                                </TableCell>
                                <TableCell align="right">
                                    <HitsCounter hits={method.stats.sc5xx} statusCode={500} />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Box>
    );
};
