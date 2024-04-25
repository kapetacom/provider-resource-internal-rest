import React, { useCallback, useId, useRef, useState } from 'react';
import { KapTableColDef } from './types';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Box, IconButton, IconButtonProps, Popover } from '@mui/material';

export interface KapTableHeadFilterProps<Data> extends IconButtonProps {
    colDef: KapTableColDef<Data>;
    filterBy?: string;
    filterValue?: unknown;
    onFilter?: (property: string, value: unknown) => void;
}

const isFilterActive = (colId: string, filterBy?: string, filterValue?: unknown) => {
    if (
        !filterBy ||
        colId !== filterBy ||
        !filterValue ||
        (Array.isArray(filterValue) && filterValue.length === 0) ||
        filterValue === ''
    ) {
        return false;
    }
    return true;
};

export const KapTableHeadFilter = <Data,>(props: KapTableHeadFilterProps<Data>) => {
    const { colDef, filterBy, filterValue, onFilter, ...iconButtonProps } = props;

    const filterAnchorRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const onOpenFilter = useCallback(() => setOpen(true), []);
    const onCloseFilter = useCallback(() => setOpen(false), []);

    const uniqueId = useId();
    const filterId = open ? `filter-dropdown-${uniqueId}` : undefined;

    const createFilterHandler = (property: string) => (event: React.MouseEvent<unknown>) => {
        onOpenFilter();
    };

    const isActive = isFilterActive(colDef.id, filterBy, filterValue);

    if (!colDef.filterRenderer) {
        console.warn(`No filterRenderer provided for column ${colDef.id}`);
        return null;
    }
    if (!onFilter) {
        console.warn(`No onFilter provided for column ${colDef.id}`);
        return null;
    }

    return (
        <>
            <IconButton
                {...iconButtonProps}
                onClick={createFilterHandler(colDef.id)}
                size="small"
                ref={filterAnchorRef}
                aria-describedby={filterId}
                sx={{
                    opacity: isActive ? 1 : 0.2,
                    transition: 'opacity 0.2s',
                }}
            >
                <FilterListIcon fontSize="small" />
            </IconButton>

            <Popover
                id={filterId}
                open={open}
                anchorEl={filterAnchorRef.current}
                onClose={onCloseFilter}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 30,
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                sx={{
                    mr: -1,
                }}
            >
                <Box sx={{ p: 1 }}>{colDef.filterRenderer(onFilter, filterValue)}</Box>
            </Popover>
        </>
    );
};
