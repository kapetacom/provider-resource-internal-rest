import { List, ListItem, ListItemIcon, Checkbox, ListItemText, ListItemButton } from '@mui/material';
import React, { ReactNode, useMemo } from 'react';

export const statusCodeRegExpMap = {
    '2xx': /^2\d\d$/,
    '3xx': /^3\d\d$/,
    '4xx': /^4\d\d$/,
    '5xx': /^5\d\d$/,
} as const;

export type StatusCode = keyof typeof statusCodeRegExpMap;

interface Status {
    code: StatusCode;
    checked: boolean;
}

export interface StatusCodeFilterProps {
    filterBy: string;
    filterValue: StatusCode[];
    onFilterChange: (filterBy: string, filterValue: string[]) => void;
}

export const StatusCodeFilter = (props: StatusCodeFilterProps) => {
    const { filterBy, filterValue = [], onFilterChange } = props;

    const statuses: Status[] = useMemo(() => {
        const statusCodes: StatusCode[] = ['2xx', '3xx', '4xx', '5xx'];
        return statusCodes.map((code) => ({
            code,
            checked: filterValue.includes(code),
        }));
    }, [filterValue]);

    const onToggle = (statusCode: StatusCode) => {
        const newFilterValue = statuses
            .filter((status) => {
                if (status.code === statusCode) {
                    return !status.checked;
                }
                return status.checked;
            })
            .map(({ code }) => code);

        onFilterChange(filterBy, newFilterValue);
    };

    return (
        <List sx={{ width: '100%', p: 0 }} dense>
            {statuses.map(({ code, checked }) => {
                const labelId = `checkbox-list-label-${code}`;

                return (
                    <ListItem key={code} disablePadding sx={{ p: 0 }}>
                        <ListItemButton
                            onClick={() => onToggle(code)}
                            sx={{
                                p: 0,
                                pl: 1,
                                pr: 1,
                            }}
                            disableRipple
                        >
                            <Checkbox
                                size="small"
                                edge="start"
                                checked={checked}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{
                                    'aria-labelledby': labelId,
                                }}
                            />
                            <ListItemText id={labelId} primary={code} />
                        </ListItemButton>
                    </ListItem>
                );
            })}
        </List>
    );
};

/*
 
<List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      {[0, 1, 2, 3].map((value) => {
        const labelId = `checkbox-list-label-${value}`;

        return (
          <ListItem
            key={value}
            secondaryAction={
              <IconButton edge="end" aria-label="comments">
                <CommentIcon />
              </IconButton>
            }
            disablePadding
          >
            <ListItemButton role={undefined} onClick={handleToggle(value)} dense>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={checked.indexOf(value) !== -1}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={`Line item ${value + 1}`} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>

 */
