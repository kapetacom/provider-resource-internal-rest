/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { ReactNode } from 'react';
import { HTTPRequest, Traffic } from '@kapeta/ui-web-types';
import byteSize from 'byte-size';
import prettyMilliseconds from 'pretty-ms';
import { Palette, Typography } from '@mui/material';

interface NoValueProps {
    /**
     * The text to display when no value is available.
     * @default '–'
     */
    text?: string;
}

/**
 * This component is used to display a placeholder when no value is available.
 */
export const NoValue = (props: NoValueProps) => {
    const { text = '–' } = props;
    return (
        <Typography variant="body2" fontSize={'0.75rem'} color="text.disabled" component="span">
            {text}
        </Typography>
    );
};

/**
 * This function converts the content-length header to a human-readable format.
 * @example asByte({ response: { headers: { 'content-length': '1024' } } }) // 1 KB
 */
export const asByte = (traffic: Traffic, fallback: ReactNode = <NoValue />): ReactNode => {
    if (traffic.response && traffic.response.headers && traffic.response.headers['content-length']) {
        const contentLength = parseInt(traffic.response.headers['content-length']);
        const { value, unit } = byteSize(contentLength, { locale: 'en-US' });
        return `${value} ${unit}`;
    }

    return fallback;
};

/**
 * This function extracts the content-type header from a headers object.
 * @example getContentType({ 'content-type': 'application/json; charset=utf-8' }) // application/json
 */
export const getContentType = (headers: HTTPRequest['headers']): string | undefined => {
    const contentType = headers['content-type'] || headers['Content-Type'];
    if (contentType) {
        return contentType.split(';')[0]; // Split and return the first element (MIME type)
    }
    return undefined; // Return undefined if the content-type header is not present
};

/**
 * This function calculates the duration of the request & response cycle.
 * @returns A human-readable string representing the duration.
 */
export const asDuration = (traffic: Traffic, fallback: ReactNode = <NoValue />): ReactNode => {
    if (traffic.created && traffic.ended) {
        return prettyMilliseconds(traffic.ended - traffic.created);
    }

    return fallback;
};

/**
 * This function returns the color associated with the HTTP status code.
 * @example getHttpStatusCodeColor(200, palette) // Light success color from the theme palette
 */
export const getHttpStatusCodeColor = (code: number, palette: Palette) => {
    if (code < 200) {
        return palette.divider;
    } else if (code >= 200 && code < 300) {
        return palette.success.light;
    } else if (code >= 300 && code < 400) {
        return palette.info.light;
    } else if (code >= 400 && code < 500) {
        return palette.warning.main;
    } else {
        return palette.error.main;
    }
};
