import React from 'react';
import { Box, BoxProps, useTheme } from '@mui/material';

export const ThemedStoryWrapper = ({ children, sx, ...boxProps }: BoxProps) => {
    const backgroundColor = useTheme().palette.mode === 'dark' ? '#121212' : 'white';

    return (
        <Box
            className="themed-story-wrapper"
            sx={{
                backgroundColor: backgroundColor,
                p: 4,
                ...sx,
            }}
            {...boxProps}
        >
            {children}
        </Box>
    );
};
