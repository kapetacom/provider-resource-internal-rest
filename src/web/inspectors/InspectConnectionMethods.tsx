import React, { Component } from "react";

import { observer } from "mobx-react";
import type {Traffic, ConnectionMethodsMapping, HTTPResponse} from "@kapeta/ui-web-types";

import "./InspectConnectionMethods.less";

interface InspectConnectionProps {
    mapping: ConnectionMethodsMapping
    trafficLines: Traffic[]
    onMethodClick:(method:string) => void
}

interface StatusCodes {
    requests: number
    sc2xx: number
    sc3xx: number
    sc4xx: number
    sc5xx: number
}
 interface ConnectionMethod {
    providerName: string
    consumerName: string
    stats: StatusCodes
}

@observer
export default class InspectConnectionMethods extends Component<InspectConnectionProps>{

    private methods: ConnectionMethod[];

    constructor(props: InspectConnectionProps) {
        super(props);
        this.methods = [];
    }

    private extractMethodsFromMapping(mapping: ConnectionMethodsMapping) {
        const methods: ConnectionMethod[] = [];
        const methodStats: { [key: string]: ConnectionMethod } = {};

        if (!mapping) {
            return methods;
        }

        Object.entries(mapping).forEach(([providerMethodId, mappingInfo]: any) => {

            const method = {
                providerName: providerMethodId,
                consumerName: mappingInfo.targetId,
                stats: {
                    requests: 0,
                    sc2xx: 0,
                    sc3xx: 0,
                    sc4xx: 0,
                    sc5xx: 0
                }
            };

            methodStats[providerMethodId] = method;
            methods.push(method);
        });

        const isInRange = (response: HTTPResponse, lowerAndEqualEnd: number, highEnd: number) => {
            if (response) {
                return response.code >= lowerAndEqualEnd && response.code < highEnd
            }
            return false;
        };

        if (this.props.trafficLines) {
            this.props.trafficLines.forEach((traffic: Traffic) => {
                const method = methodStats[traffic.providerMethodId];
                if (!method) {
                    console.warn('Unknown provider method for traffic', traffic.providerMethodId);
                    return;
                }

                method.stats.requests++;
                if (!traffic.response) {
                    return;
                }

                if (isInRange(traffic.response, 200, 300)) {
                    method.stats.sc2xx++;
                }
                if (isInRange(traffic.response, 300, 400)) {
                    method.stats.sc3xx++;
                }
                if (isInRange(traffic.response, 400, 500)) {
                    method.stats.sc4xx++;
                }
                if (traffic.response.code >= 500) {
                    method.stats.sc5xx++;
                }
            });
        }

        return methods;
    }

    render() {

        this.methods = this.extractMethodsFromMapping(this.props.mapping);

        return (
            <div className="inspect-connection-methods">
                <table cellSpacing={0}>
                    <thead>
                        <tr className={'sections'}>
                            <th/>
                            <th className={'hits'}/>
                            <th colSpan={4} className={'status-codes'}>HTTP Status</th>
                        </tr>
                        <tr>
                            <th className={'methods'}>Methods</th>
                            <th className={'hits'}>Hits</th>
                            <th className={'status-code'}>2xx</th>
                            <th className={'status-code'}>3xx</th>
                            <th className={'status-code'}>4xx</th>
                            <th className={'status-code'}>5xx</th>
                        </tr>
                    </thead>
                    <tbody>

                    {this.methods.map((methodLine: ConnectionMethod, index: number) => {
                        return (
                            <tr key={index} onClick={() => this.props.onMethodClick(methodLine.providerName)}>
                                <td className={'methods'}>
                                    <span className={'provider'}>{methodLine.providerName}</span>
                                    <i className="fal fa-long-arrow-right" />
                                    <span className={'consumer'}>{methodLine.consumerName}</span>
                                </td>
                                <td className={'hits'}>
                                    {methodLine.stats.requests}
                                </td>
                                <td className={'status-code ok'}>
                                    {methodLine.stats.sc2xx}
                                </td>
                                <td className={'status-code redirect'}>
                                    {methodLine.stats.sc3xx}
                                </td>
                                <td className={'status-code client-error'}>
                                    {methodLine.stats.sc4xx}
                                </td>
                                <td className={'status-code server-error'}>
                                    {methodLine.stats.sc5xx}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>

            </div>
        )
    }
}