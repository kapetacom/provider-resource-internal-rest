/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo, useState } from 'react';
import { Order, KapTableBodyRow, KapTableColDef } from './types';
import { Table as MuiTable, TableContainer, TableHead as MuiTableHead, TableBody as MuiTableBody } from '@mui/material';
import { KapTableHead } from './KapTableHead';
import { KapTableBody } from './KapTableBody';
import { getComparator } from './comparatorHelpers';

export interface KapTableProps<Data> {
    colDefs: KapTableColDef<Data>[];
    rows: Data[];
    onRowClick?: (rowData: Data, rowIndex: number) => void;
    tableContainerProps?: React.ComponentProps<typeof TableContainer>;
    tableProps?: React.ComponentProps<typeof MuiTable>;
    tableHeadProps?: React.ComponentProps<typeof MuiTableHead>;
    tableBodyProps?: React.ComponentProps<typeof MuiTableBody>;
}

export const KapTable = <Data extends { id: string }>(props: KapTableProps<Data>) => {
    const { colDefs, rows, onRowClick, tableContainerProps, tableProps, tableHeadProps, tableBodyProps } = props;

    const colDefDefaultSort = colDefs.find((colDef) => colDef.sort);

    const [orderBy, setOrderBy] = useState<string>(colDefDefaultSort?.id ?? colDefs[0].id); // Default to the first column
    const [order, setOrder] = useState<Order>(colDefDefaultSort?.sort ?? 'asc'); // Default to ascending order

    const handleRequestSort = (_event: React.MouseEvent<unknown>, property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const comparator = useMemo(() => getComparator(colDefs, order, orderBy), [colDefs, order, orderBy]);

    const kapTableRows: KapTableBodyRow<Data>[] = useMemo(() => {
        return rows.map((data) => ({ data })).sort(comparator);
    }, [rows, comparator]);

    return (
        <TableContainer {...tableContainerProps} sx={{ ...tableContainerProps?.sx, overflow: 'visible' }}>
            <MuiTable {...tableProps}>
                <KapTableHead
                    {...tableHeadProps}
                    colDefs={colDefs}
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                />
                {rows.length > 0 && (
                    <KapTableBody colDefs={colDefs} rows={kapTableRows} onRowClick={onRowClick} {...tableBodyProps} />
                )}
            </MuiTable>
        </TableContainer>
    );
};
