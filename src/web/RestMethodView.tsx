import React, {Component} from "react";

import {typeName} from "@kapeta/schemas";

import {RESTMethodEdit} from "./types";

import './RestMethodView.less'

interface RestMethodViewProps {
    method: RESTMethodEdit,
    compact?:boolean
}

export default class RestMethodView extends Component<RestMethodViewProps, any> {

    render() {
        const method = this.props.method;
        const compact = !!this.props.compact;
        if (!method.arguments) {
            method.arguments = [];
        }
        console.log('method.responseType', method.responseType);

        return (
            <div className={"rest-method-erasure" + (compact ? ' compact' : '')}>
                <div className={"method"} title={method.description}>
                    <span className={"method-name"}>{method.id}</span>
                    <span className={"method-definition-start"}>(</span>
                    <span className={'method-arguments'}>
                            {
                                method.arguments.map((argument, ix) => {
                                    return (
                                        <span key={ix} className={"method-argument"}>
                                            <span className={"name"}>
                                                {argument.id}
                                            </span>
                                            <span className={'type-separator'}>:</span>
                                            <span className={"type"}>
                                                {typeName(argument.type)}
                                            </span>
                                            <span className={"transport"}>
                                                {`(${argument.transport})`}
                                            </span>

                                            <span className={"separator"}>,</span>
                                        </span>
                                    )
                                })
                            }
                        </span>
                    <span className={"method-definition-end"}>):</span>
                    <span className={"type return"}>
                        {typeName(method.responseType)}
                    </span>

                </div>
                <div className={"path"}>
                    <span className={'label'}>HTTP:</span>
                    <span className={"http-method"}>{method.method}</span>
                    <span className={"http-path"}>{method.path}</span>
                </div>
            </div>
        )
    }

}