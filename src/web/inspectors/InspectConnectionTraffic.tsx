/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Traffic } from '@kapeta/ui-web-types';
import { toClass, httpStatusPhrase } from '@kapeta/ui-web-utils';
import byteSize from 'byte-size';
import './InspectConnectionTraffic.less';
import { toDateText } from '@kapeta/ui-web-components';

interface InspectMethodTrafficProps {
    trafficLines: Traffic[];
    providerMethod: string;
    onTrafficClick: (traffic: Traffic) => void;
}

function asTime(traffic: Traffic) {
    return toDateText({
        date: new Date(traffic.ended),
    });
}

function asByte(traffic: Traffic) {
    if (traffic.response && traffic.response.headers && traffic.response.headers['content-length']) {
        const contentLength = parseInt(traffic.response.headers['content-length']);
        const { value, unit } = byteSize(contentLength, { locale: 'en-US' });
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

export const InspectConnectionTraffic = (props: InspectMethodTrafficProps) => {
    const { trafficLines, onTrafficClick } = props;

    return (
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
                    {trafficLines.map((traffic, index) => {
                        return (
                            <tr key={index} onClick={() => onTrafficClick(traffic)}>
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
    );
};
