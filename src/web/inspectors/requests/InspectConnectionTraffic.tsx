/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Traffic } from '@kapeta/ui-web-types';
import { asByte, asDuration } from '../helpers';
import { Table, TableBody, TableHead, TableCell, TableRow } from '@mui/material';
import { RequestStatusCode } from './RequestStatusCode';
import { DateDisplay } from '@kapeta/ui-web-components';

interface InspectMethodTrafficProps {
    trafficLines: Traffic[];
    providerMethod: string;
    onTrafficClick: (traffic: Traffic, index: number) => void;
}

export const InspectConnectionTraffic = (props: InspectMethodTrafficProps) => {
    const { trafficLines, providerMethod, onTrafficClick } = props;

    return (
        <Table size="small" aria-label={`Requests for the ${providerMethod} method}`}>
            <TableHead sx={{ '.MuiTableCell-head': { fontWeight: 500 } }}>
                <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell align="right">Timestamp</TableCell>
                    <TableCell align="right">Time</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {trafficLines.map((traffic, index) => {
                    return (
                        <TableRow
                            key={index}
                            onClick={() => onTrafficClick(traffic, index + 1)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: '#f5f5f5',
                                },
                            }}
                        >
                            <TableCell>{<RequestStatusCode code={traffic.response?.code} />}</TableCell>
                            <TableCell align="right">{asByte(traffic)}</TableCell>
                            <TableCell align="right">
                                <DateDisplay
                                    date={traffic.created}
                                    allowRelative={false}
                                    format={{ timeStyle: 'short' }}
                                />
                            </TableCell>
                            <TableCell align="right">{asDuration(traffic)}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};
