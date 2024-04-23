import { RowComparator, KapTableBodyRow, KapTableColDef, Order } from './types';

const createRowDataComparator =
    <T>(comparator: RowComparator<T>, order: Order) =>
    (a: KapTableBodyRow<T>, b: KapTableBodyRow<T>) => {
        return comparator(a.data, b.data) * (order === 'asc' ? 1 : -1);
    };

/**
 * Returns a comparator function for a given column definition.
 * @param colDefs The column definitions.
 * @param order The sort order.
 * @param orderBy The column to sort by.
 */
export const getComparator = <Data>(colDefs: KapTableColDef<Data>[], order: Order, orderBy: string) => {
    const colDef = colDefs.find((c) => c.id === orderBy);

    if (!colDef) {
        return () => 0;
    }

    return createRowDataComparator(colDef.comparator, order);
};
