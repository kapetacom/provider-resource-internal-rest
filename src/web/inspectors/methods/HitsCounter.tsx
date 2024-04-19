/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { keyframes } from '@emotion/react';
import { getHttpStatusCodeColor } from '../helpers';

const animationRipple = keyframes`
    from {
        transform: scale(0);
        opacity: 0.5;
    }
    to {
        transform: scale(1.75);
        opacity: 0;
    }
`;

interface HitsCounterProps {
    /**
     * The number of hits to display
     */
    hits: number;
    /**
     * The status code of the response
     */
    statusCode: number;
}

/**
 * This component renders a number and animates a ripple effect behind it when the number changes.
 * The color of the ripple is determined by the status code of the response.
 */
export const HitsCounter = (props: HitsCounterProps) => {
    const { statusCode, hits } = props;

    const [activeAnimations, setActiveAnimations] = useState<Set<number>>(new Set());

    const initialValue = useRef(hits);
    useEffect(() => {
        if (initialValue.current === hits) {
            return; // Do not add the hits number when the component mounts
        }
        setActiveAnimations((prev) => new Set(prev.add(hits)));
    }, [hits]);

    const handleAnimationEnd = (number: number) => {
        // Remove the number from activeAnimations once the animation completes
        setActiveAnimations((prev) => {
            const newSet = new Set(prev);
            newSet.delete(number);
            return newSet;
        });
    };

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'inline-block',
                backgroundColor: 'initial',
            }}
        >
            {Array.from(activeAnimations).map((number) => (
                <Box
                    key={number}
                    sx={(theme) => ({
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '25px',
                        height: '25px',
                        marginLeft: '-12.5px',
                        marginTop: '-12.5px',
                        borderRadius: '50%',
                        backgroundColor: getHttpStatusCodeColor(statusCode, theme.palette),
                        animation: `${animationRipple} 1s ease-out forwards`,
                    })}
                    onAnimationEnd={() => handleAnimationEnd(number)}
                />
            ))}
            <Box component="span" sx={{ position: 'relative', fontVariantNumeric: 'tabular-nums' }}>
                {hits}
            </Box>
        </Box>
    );
};
