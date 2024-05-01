/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { Component } from 'react';

import './RestMethodView.less';
import { DSLTypeHelper, RESTMethodReader } from '@kapeta/kaplang-core';
import { DSLControllerMethod, toId } from './mapping/types';
import { Tooltip } from '@kapeta/ui-web-components';
import { Box } from '@mui/material';

interface RestMethodViewProps {
    method: DSLControllerMethod;
    compact?: boolean;
}

export default class RestMethodView extends Component<RestMethodViewProps, any> {
    render() {
        const method = this.props.method;
        const compact = !!this.props.compact;
        let methodName = toId(method);

        const reader = new RESTMethodReader(method);
        const body = (
            <div className={'rest-method-erasure' + (compact ? ' compact' : '')}>
                <div className={'method'}>
                    <span className={'method-name'}>{methodName}</span>
                    <span className={'method-definition-start'}>(</span>
                    <span className={'method-arguments'}>
                        {reader.parameters.map((argument, ix) => {
                            return (
                                <span key={ix} className={'method-argument'}>
                                    <span className={'name'}>{argument.name}</span>
                                    <span className={'type-separator'}>:</span>
                                    <span className={'type'}>{DSLTypeHelper.asFullName(argument.type)}</span>
                                    <span className={'transport'}>{`(${argument.transport})`}</span>

                                    <span className={'separator'}>,</span>
                                </span>
                            );
                        })}
                    </span>
                    <span className={'method-definition-end'}>):</span>
                    <span className={'type return'}>{DSLTypeHelper.asFullName(reader.returnType)}</span>
                </div>
                <div className={'path'}>
                    <span className={'label'}>HTTP:</span>
                    <span className={'http-method'}>{reader.method}</span>
                    <span className={'http-path'}>{reader.path}</span>
                </div>
            </div>
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
                PopperProps={{
                    disablePortal: true,
                }}
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
