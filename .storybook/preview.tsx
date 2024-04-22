import React, { useMemo } from 'react';
import { Preview } from '@storybook/react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { lightTheme, darkTheme } from '@kapeta/style';

const THEMES = {
    light: createTheme(lightTheme as any),
    dark: createTheme(darkTheme as any),
};

export const withMuiTheme = (Story, context) => {
    // The theme global we just declared
    const { theme: themeKey } = context.globals;

    // only recompute the theme if the themeKey changes
    const theme = useMemo(() => THEMES[themeKey] || THEMES['light'], [themeKey]);

    return (
        <div>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Story />
            </ThemeProvider>
        </div>
    );
};

const preview: Preview = {
    decorators: [
        (Story) => (
            <div>
                <Story />
            </div>
        ),
    ],
};

export default preview;
