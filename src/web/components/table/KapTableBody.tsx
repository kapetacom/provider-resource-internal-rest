import React from 'react';
import { TableBody, TableCell, TableRow } from '@mui/material';
import { KapTableBodyRow, KapTableColDef } from './types';

export interface KapTableBodyProps<Data> {
    colDefs: readonly KapTableColDef<Data>[];
    rows: readonly KapTableBodyRow<Data>[];
    onRowClick?: (rowData: Data, rowIndex: number) => void;
}

export const KapTableBody = <Data,>(props: KapTableBodyProps<Data>) => {
    const { colDefs, rows, onRowClick } = props;

    return (
        <TableBody>
            {rows.map(({ data }, rowIndex) => (
                <TableRow
                    key={data.id}
                    onClick={() => onRowClick?.(data, rowIndex)}
                    hover={!!onRowClick}
                    sx={{ cursor: onRowClick ? 'pointer' : 'initial' }}
                >
                    {colDefs.map((colDef) => {
                        return (
                            <TableCell
                                key={colDef.id}
                                align={colDef.numeric ? 'right' : 'left'}
                                padding={colDef.disablePadding ? 'none' : 'normal'}
                            >
                                {colDef.valueRenderer(data)}
                            </TableCell>
                        );
                    })}
                </TableRow>
            ))}
        </TableBody>
    );
};
