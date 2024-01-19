/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { Component } from 'react';

import { RESTMethodEdit } from './types';

import './RestMethodView.less';
import { EntityHelpers } from '@kapeta/kaplang-core';

interface RestMethodViewProps {
    method: RESTMethodEdit;
    compact?: boolean;
}

export default class RestMethodView extends Component<RestMethodViewProps, any> {
    render() {
        const method = this.props.method;
        const compact = !!this.props.compact;
        if (!method.arguments) {
            method.arguments = [];
        }

        let methodName = method.id;

        if (method.controllerName) {
            if (methodName.startsWith(method.controllerName + '_')) {
                methodName = methodName.substring(method.controllerName.length + 1);
            }
            methodName = `${method.controllerName}::${methodName}`;
        }

        return (
            <div className={'rest-method-erasure' + (compact ? ' compact' : '')}>
                <div className={'method'} title={method.description}>
                    <span className={'method-name'}>{methodName}</span>
                    <span className={'method-definition-start'}>(</span>
                    <span className={'method-arguments'}>
                        {method.arguments.map((argument, ix) => {
                            return (
                                <span key={ix} className={'method-argument'}>
                                    <span className={'name'}>{argument.id}</span>
                                    <span className={'type-separator'}>:</span>
                                    <span className={'type'}>{EntityHelpers.typeName(argument)}</span>
                                    <span className={'transport'}>{`(${argument.transport})`}</span>

                                    <span className={'separator'}>,</span>
                                </span>
                            );
                        })}
                    </span>
                    <span className={'method-definition-end'}>):</span>
                    <span className={'type return'}>{EntityHelpers.typeName(method.responseType)}</span>
                </div>
                <div className={'path'}>
                    <span className={'label'}>HTTP:</span>
                    <span className={'http-method'}>{method.method}</span>
                    <span className={'http-path'}>{method.path}</span>
                </div>
            </div>
        );
    }
}
