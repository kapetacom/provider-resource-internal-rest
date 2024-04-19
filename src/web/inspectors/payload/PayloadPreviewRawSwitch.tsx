/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { FormControlLabel, Switch, styled } from '@mui/material';
import { usePayloadAccordionContext } from './PayloadAccordionContext';

const StyledSwitch = styled(Switch)(({ theme }) => ({
    width: 28,
    height: 16,
    padding: 0,
    display: 'flex',
    '&:active': {
        '& .MuiSwitch-thumb': {
            width: 15,
        },
        '& .MuiSwitch-switchBase.Mui-checked': {
            transform: 'translateX(9px)',
        },
    },
    '& .MuiSwitch-switchBase': {
        padding: 2,
        '&.Mui-checked': {
            transform: 'translateX(12px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: theme.palette.primary.main,
            },
        },
    },
    '& .MuiSwitch-thumb': {
        boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
        width: 12,
        height: 12,
        borderRadius: 6,
        transition: theme.transitions.create(['width'], {
            duration: 200,
        }),
    },
    '& .MuiSwitch-track': {
        borderRadius: 16 / 2,
        opacity: 1,
        backgroundColor: 'rgba(0,0,0,.25)',
        boxSizing: 'border-box',
    },
}));

interface PayloadRawSwitchProps {
    /**
     * If the switch is disabled
     */
    disabled?: boolean;
}

export const PayloadRawSwitch = (props: PayloadRawSwitchProps) => {
    const { disabled } = props;

    const { raw, setRaw } = usePayloadAccordionContext();

    return (
        <FormControlLabel
            label="Raw"
            control={<StyledSwitch checked={raw} color="primary" onChange={(event, value) => setRaw(value)} />}
            onClick={(event) => event.stopPropagation()} // Prevent the accordion from toggling when the switch is clicked
            className="payload-raw-switch"
            sx={{
                '&.MuiFormControlLabel-root': {
                    mr: 0,
                    '.MuiFormControlLabel-label': {
                        fontSize: 12,
                        ml: 0.5,
                    },
                },
            }}
            disabled={disabled}
        />
    );
};
