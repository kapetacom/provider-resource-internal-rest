/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { Component } from 'react';

import './RestMethodView.less';
import { DSLTypeHelper, RESTMethodReader } from '@kapeta/kaplang-core';
import { DSLControllerMethod, toId } from './mapping/types';

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

        return (
            <div className={'rest-method-erasure' + (compact ? ' compact' : '')}>
                <div className={'method'} title={method.description}>
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
    }
}
