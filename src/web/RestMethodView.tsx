/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { Component, ComponentProps, PropsWithChildren, useMemo } from 'react';

import { DSLTypeHelper, RESTMethodReader } from '@kapeta/kaplang-core';
import { DSLControllerMethod, toId } from './mapping/types';
import { Tooltip } from '@kapeta/ui-web-components';
import { Box, SxProps, useTheme } from '@mui/material';

interface RestMethodViewProps {
    method: DSLControllerMethod;
    compact?: boolean;
}

type BoxProps = ComponentProps<typeof Box>;
const Span = (props: PropsWithChildren<BoxProps>) => <Box component={'span'} {...props} />;

const ellipsisStyle: SxProps = {
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
};

const useThemedColors = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return {
        defaultTextColor: isDark ? '#ffffff' : '#000000',
        methodNameColor: isDark ? '#ffffff' : '#544b49',
        methodParenthesesColor: isDark ? '#ffffff' : '#666',
        argumentNameColor: theme.palette.success.main,
        argumentTypeColor: isDark ? '#d8d6d6' : '#1d2b91',
        argumentTypeCompactColor: theme.palette.success.main,
        argumentTransportColor: isDark ? '#d8d6d6' : '#999',
        returnTypeColor: isDark ? '#d8d6d6' : '#1d2b91',
        protocolColor: isDark ? '#ffffff' : '#544b49',
        httpMethodColor: isDark ? '#ffffff' : '#1d2b91',
        httpPathColor: theme.palette.success.main,
    };
};

export const RestMethodView = (props: RestMethodViewProps) => {
    const { method, compact } = props;

    const reader = useMemo(() => new RESTMethodReader(method), [method]);

    const methodName = toId(method);

    const {
        defaultTextColor,
        methodNameColor,
        methodParenthesesColor,
        argumentNameColor,
        argumentTypeColor,
        argumentTypeCompactColor,
        argumentTransportColor,
        returnTypeColor,
        protocolColor,
        httpMethodColor,
        httpPathColor,
    } = useThemedColors();

    const body = (
        <Box
            className={'rest-method'}
            sx={{
                fontSize: '12px',
                overflow: 'hidden',
                padding: '0 50px 0 15px',
            }}
        >
            <Box
                sx={{
                    ...ellipsisStyle,
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                }}
            >
                <Span sx={{ color: methodNameColor }} aria-label="method name">
                    {methodName}
                </Span>
                <Span sx={{ color: methodParenthesesColor }} aria-label={'method-definition-start'}>
                    (
                </Span>
                <Span aria-label={'method-arguments'}>
                    {reader.parameters.map((argument, ix, xs) => {
                        return (
                            <Span
                                key={ix}
                                aria-label={'method-argument'}
                                sx={{
                                    mx: '2px',
                                    '& > *:not(.separator)': {
                                        mx: '2px',
                                    },
                                }}
                            >
                                {compact ? null : (
                                    <Span
                                        sx={{
                                            color: argumentNameColor,
                                        }}
                                        aria-label={'name'}
                                    >
                                        {argument.name}
                                    </Span>
                                )}
                                {compact ? null : (
                                    <Span aria-hidden className={'separator'} sx={{ color: defaultTextColor }}>
                                        :
                                    </Span>
                                )}

                                <Span
                                    sx={{
                                        color: compact ? argumentTypeCompactColor : argumentTypeColor,
                                    }}
                                    aria-label={'type'}
                                >
                                    {DSLTypeHelper.asFullName(argument.type)}
                                </Span>

                                {compact ? null : (
                                    <Span
                                        sx={{
                                            color: argumentTransportColor,
                                        }}
                                        aria-label={'transport'}
                                    >{`(${argument.transport})`}</Span>
                                )}

                                {ix < xs.length - 1 ? (
                                    <Span aria-hidden className={'separator'} sx={{ color: defaultTextColor }}>
                                        ,
                                    </Span>
                                ) : null}
                            </Span>
                        );
                    })}
                </Span>
                <Span sx={{ color: methodParenthesesColor }} aria-label={'method-definition-end'}>
                    ):
                </Span>
                <Span sx={{ color: returnTypeColor, mx: '2px' }} aria-label={'return-type'}>
                    {DSLTypeHelper.asFullName(reader.returnType)}
                </Span>
            </Box>

            {compact ? null : (
                <Box sx={{ ...ellipsisStyle, fontFamily: 'monospace' }}>
                    <Span sx={{ fontWeight: 600, color: protocolColor }} aria-label={'procotol'}>
                        HTTP:
                    </Span>
                    <Span sx={{ marginLeft: '5px', color: httpMethodColor }} aria-label={'http-method'}>
                        {reader.method}
                    </Span>
                    <Span sx={{ marginLeft: '5px', color: httpPathColor }} aria-label={'http-path'}>
                        {reader.path}
                    </Span>
                </Box>
            )}
        </Box>
    );

    return (
        <Tooltip
            arrow={false}
            title={
                <>
                    {method.description ? (
                        <Box sx={{ fontSize: '12px', whiteSpace: 'pre', pl: 2, pb: 1, opacity: 0.6 }}>
                            {'/**\n'}
                            {method.description
                                .split('\n')
                                .map((s) => ' * ' + s)
                                .join('\n')}
                            {'\n */'}
                        </Box>
                    ) : null}
                    {body}
                </>
            }
            enterDelay={1000}
            enterNextDelay={300}
            placement="bottom-start"
            sx={{
                '& .MuiTooltip-tooltip': { overflow: 'visible', maxWidth: 'none', font: 'inherit', px: 0, pb: 2 },
                '& .method': {
                    overflowX: 'auto !important',
                    width: 'auto !important',
                },
            }}
        >
            {body}
        </Tooltip>
    );
};

export default RestMethodView;
