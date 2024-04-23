/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { ReactNode } from 'react';

export type Order = 'asc' | 'desc';

export type RowComparator<Data> = (a: Data, b: Data) => number;

export interface KapTableColDef<Data> {
    /**
     * Unique identifier for the column.
     */
    id: string;
    /**
     * The label to display in the column header.
     */
    label: ReactNode;
    /**
     * Whether the column should be right-aligned.
     */
    numeric: boolean;
    /**
     * Whether the column should have padding.
     */
    disablePadding?: boolean;
    /**
     * A function that returns the value to display in the cell. If not provided, the value will be
     * displayed as-is.
     */
    valueRenderer: (value: Data) => ReactNode;
    /**
     * Optional comparator function used when sorting the rows based on this column. If not
     * provided, a default comparator will be used.
     */
    comparator: RowComparator<Data>;
    /**
     * Whether the column is sorted as default and the order of the sort.
     */
    sort?: Order;
}

export interface KapTableBodyCell {
    /**
     * Unique identifier for the cell.
     */
    id: string;
    /**
     * The value to display in the cell.
     */
    value: ReactNode;
}

export type RowData<Data> = {
    /**
     * An id field is required for each row to uniquely identify it.
     */
    id: string;
} & Data;

export type KapTableBodyRow<Data> = {
    /**
     * Data associated with the row.
     */
    data: RowData<Data>;
};
