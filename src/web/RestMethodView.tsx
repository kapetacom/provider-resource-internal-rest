/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { Component, ComponentProps, PropsWithChildren } from 'react';

import { DSLTypeHelper, RESTMethodReader } from '@kapeta/kaplang-core';
import { DSLControllerMethod, toId } from './mapping/types';
import { Tooltip } from '@kapeta/ui-web-components';
import { Box, SxProps } from '@mui/material';

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

const colorGreen = '#39b537';
const colorBlue = '#1d2b91';
const colorGrayXDark = '#544b49';

export default class RestMethodView extends Component<RestMethodViewProps, any> {
    render() {
        const method = this.props.method;
        const compact = !!this.props.compact;
        const methodName = toId(method);

        const reader = new RESTMethodReader(method);
        const body = (
            <Box
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
                    <Span
                        sx={{
                            color: '#544b49',
                        }}
                        aria-label="method name"
                    >
                        {methodName}
                    </Span>
                    <Span
                        sx={{
                            color: '#666',
                        }}
                        aria-label={'method-definition-start'}
                    >
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
                                                color: colorGreen,
                                            }}
                                            aria-label={'name'}
                                        >
                                            {argument.name}
                                        </Span>
                                    )}
                                    {compact ? null : (
                                        <span aria-hidden className={'separator'}>
                                            :
                                        </span>
                                    )}

                                    <Span
                                        sx={{
                                            color: compact ? colorGreen : colorBlue,
                                        }}
                                        aria-label={'type'}
                                    >
                                        {DSLTypeHelper.asFullName(argument.type)}
                                    </Span>

                                    {compact ? null : (
                                        <Span
                                            sx={{
                                                color: '#999',
                                            }}
                                            aria-label={'transport'}
                                        >{`(${argument.transport})`}</Span>
                                    )}

                                    {ix < xs.length - 1 ? (
                                        <span aria-hidden className={'separator'}>
                                            ,
                                        </span>
                                    ) : null}
                                </Span>
                            );
                        })}
                    </Span>
                    <Span
                        sx={{
                            color: '#666',
                        }}
                        aria-label={'method-definition-end'}
                    >
                        ):
                    </Span>
                    <Span
                        sx={{
                            color: colorBlue,
                            mx: '2px',
                        }}
                        aria-label={'return-type'}
                    >
                        {DSLTypeHelper.asFullName(reader.returnType)}
                    </Span>
                </Box>
                {compact ? null : (
                    <Box sx={{ ...ellipsisStyle, fontFamily: 'monospace' }}>
                        <Span
                            sx={{
                                fontWeight: 600,
                                color: colorGrayXDark,
                            }}
                            aria-label={'procotol'}
                        >
                            HTTP:
                        </Span>
                        <Span
                            sx={{
                                marginLeft: '5px',
                                color: colorBlue,
                            }}
                            aria-label={'http-method'}
                        >
                            {reader.method}
                        </Span>
                        <Span
                            sx={{
                                marginLeft: '5px',
                                color: colorGreen,
                            }}
                            aria-label={'http-path'}
                        >
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
    }
}
