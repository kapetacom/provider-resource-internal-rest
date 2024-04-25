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
import { KapTableHeadFilter } from './KapTableHeadFilter';

export interface KapTableHeadProps<Data> extends MuiTableHeadProps {
    colDefs: readonly KapTableColDef<Data>[];
    onRequestSort: (event: React.MouseEvent<unknown>, property: string) => void;
    order: Order;
    orderBy: string;
    filterBy?: string;
    filterValue?: unknown;
    onFilter?: (property: string, value: unknown) => void;
}

export const KapTableHead = <Data,>(props: KapTableHeadProps<Data>) => {
    const { colDefs, onRequestSort, order, orderBy, filterBy, filterValue, onFilter, ...muiTableHeadProps } = props;

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
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    '.column-filter-button': {
                                        opacity: 1,
                                    },
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <MuiTableSortLabel
                                    active={orderBy === colDef.id}
                                    direction={orderBy === colDef.id ? order : 'asc'}
                                    onClick={createSortHandler(colDef.id)}
                                    sx={{ flexGrow: 1 }}
                                >
                                    {colDef.label}
                                    {orderBy === colDef.id ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                        </Box>
                                    ) : null}
                                </MuiTableSortLabel>

                                {colDef.filter && (
                                    <KapTableHeadFilter
                                        colDef={colDef}
                                        filterBy={filterBy}
                                        filterValue={filterValue}
                                        onFilter={onFilter}
                                        className="column-filter-button"
                                        sx={{ mr: -1 }}
                                    />
                                )}
                            </Box>
                        </MuiTableCell>
                    );
                })}
            </MuiTableRow>
        </MuiTableHead>
    );
};
