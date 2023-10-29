/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { Component } from 'react';
import { observer } from 'mobx-react';

import { ResourceRole, Traffic } from '@kapeta/ui-web-types';

import { countdown } from '@kapeta/ui-web-utils';
import { toClass, httpStatusPhrase } from '@kapeta/ui-web-utils';

import byteSize from 'byte-size';

import './InspectConnectionTraffic.less';

countdown.setLabels(
    ' ms| s| min| h| day| week| mth| yr| decade| century| millennium',
    ' ms| s| min| hrs| days| weeks| mths| yrs| decades| centuries| millennia',
    ', ',
    ' and ',
    '',
    '',
    ''
);

interface InspectMethodTrafficProps {
    trafficLines: Traffic[];
    providerMethod: string;
    onTrafficClick: (traffic: Traffic) => void;
}

@observer
export default class InspectConnectionTraffic extends Component<InspectMethodTrafficProps> {
    sender: ResourceRole = ResourceRole.CONSUMES;

    render() {
        function asTime(traffic: Traffic) {
            let endTime = traffic.ended;
            if (!endTime) {
                endTime = new Date().getTime();
            }

            return '' + countdown(traffic.created, endTime, countdown.MINUTES, null, null);
        }

        function asByte(traffic: Traffic) {
            if (traffic.response && traffic.response.headers && traffic.response.headers['content-length']) {
                const { value, unit } = byteSize(traffic.response.headers['content-length']);
                return `${value} ${unit}`;
            }

            return '-';
        }

        function asType(traffic: Traffic) {
            if (traffic.response && traffic.response.headers && traffic.response.headers['content-type']) {
                return traffic.response.headers['content-type'];
            }

            return 'Unknown';
        }

        return (
            <>
                <div className={'inspect-method-traffic'}>
                    <table cellSpacing={0}>
                        <thead>
                            <tr>
                                <th className={'name'}>Name</th>
                                <th className={'type'}>Type</th>
                                <th className={'method'}>Method</th>
                                <th className={'status'}>Status</th>
                                <th className={'size'}>Size</th>
                                <th className={'time'}>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.props.trafficLines.map((traffic, index) => {
                                return (
                                    <tr onClick={() => this.props.onTrafficClick(traffic)}>
                                        <td className={'name'}>{traffic.request.url}</td>
                                        <td className={'type'}>{asType(traffic)}</td>
                                        <td className={'method'}>{traffic.request.method.toUpperCase()}</td>
                                        <td
                                            className={toClass({
                                                status: true,
                                                pending: !traffic.response,
                                            })}
                                        >
                                            {traffic.response ? (
                                                traffic.response.code
                                            ) : (
                                                <i className="fa fa-circle-notch fa-spin" />
                                            )}
                                            {traffic.response ? (
                                                <>
                                                    <br />
                                                    {httpStatusPhrase(traffic.response.code)}
                                                </>
                                            ) : (
                                                ''
                                            )}
                                        </td>
                                        <td className={'size'}>{asByte(traffic)}</td>
                                        <td className={'time'}>{asTime(traffic)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </>
        );
    }
}
