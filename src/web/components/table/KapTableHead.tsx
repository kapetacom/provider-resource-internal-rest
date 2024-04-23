/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { KapTableColDef, Order } from './types';
import {
    Box,
    TableHead as MuiTableHead,
    TableHeadProps as MuiTableHeadProps,
    TableRow as MuiTableRow,
    TableCell as MuiTableCell,
    TableSortLabel as MuiTableSortLabel,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

export interface KapTableHeadProps<Data> extends MuiTableHeadProps {
    colDefs: readonly KapTableColDef<Data>[];
    onRequestSort: (event: React.MouseEvent<unknown>, property: string) => void;
    order: Order;
    orderBy: string;
}

export const KapTableHead = <Data,>(props: KapTableHeadProps<Data>) => {
    const { colDefs, order, orderBy, onRequestSort, ...muiTableHeadProps } = props;

    const createSortHandler = (property: string) => (event: React.MouseEvent<unknown>) => {
        onRequestSort(event, property);
    };

    return (
        <MuiTableHead {...muiTableHeadProps}>
            <MuiTableRow>
                {colDefs.map((colDef) => {
                    return (
                        <MuiTableCell
                            key={colDef.id}
                            align={colDef.numeric ? 'right' : 'left'}
                            padding={colDef.disablePadding ? 'none' : 'normal'}
                            sortDirection={orderBy === colDef.id ? order : false}
                        >
                            <MuiTableSortLabel
                                active={orderBy === colDef.id}
                                direction={orderBy === colDef.id ? order : 'asc'}
                                onClick={createSortHandler(colDef.id)}
                            >
                                {colDef.label}
                                {orderBy === colDef.id ? (
                                    <Box component="span" sx={visuallyHidden}>
                                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                    </Box>
                                ) : null}
                            </MuiTableSortLabel>
                        </MuiTableCell>
                    );
                })}
            </MuiTableRow>
        </MuiTableHead>
    );
};
