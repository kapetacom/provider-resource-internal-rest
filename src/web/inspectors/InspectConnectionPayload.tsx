/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';

import { TabContainer, TabPage } from '@kapeta/ui-web-components';
import { httpStatusPhrase } from '@kapeta/ui-web-utils';

import './InspectConnectionPayload.less';
import { Traffic } from '@kapeta/ui-web-types';

interface InspectTrafficPayloadProps {
    traffic: Traffic;
}

export const InspectConnectionPayload = (props: InspectTrafficPayloadProps) => {
    const {
        traffic: { response, request },
    } = props;

    const renderHeaders = (headers: { [key: string]: string }) => {
        return Object.keys(headers).map((headerKey: string, index: number) => {
            return (
                <tr key={index}>
                    <th>{headerKey}</th>
                    <td>{headers[headerKey]}</td>
                </tr>
            );
        });
    };

    const renderBody = (body?: string) => {
        return <pre className={'body'}>{body || <em>No body available</em>}</pre>;
    };

    return (
        <div className={'inspect-connection-payload'}>
            <div className={'overview'}>
                <span className="method">{request.method}</span>
                <span className="url">{request.url}</span>

                <span className={'status'}>
                    {response ? (
                        <>
                            <span className={'code'}>{response.code}</span>
                            <em>( {httpStatusPhrase(response.code)} )</em>
                        </>
                    ) : (
                        'Pending'
                    )}
                </span>
            </div>

            <TabContainer>
                <TabPage id={'request'} title={'Request'}>
                    <div className={'section'}>
                        <h4>Headers</h4>
                        <table cellSpacing={0} className={'headers'}>
                            <tbody>{renderHeaders(request.headers)}</tbody>
                        </table>
                    </div>
                    <div className={'section'}>
                        <h4>Body</h4>
                        {renderBody(request.body)}
                    </div>
                </TabPage>

                {response && (
                    <TabPage id={'response'} title={'Response'}>
                        <div className={'section'}>
                            <h4>Headers</h4>
                            <table cellSpacing={0} className={'headers'}>
                                <tbody>{renderHeaders(response.headers)}</tbody>
                            </table>
                        </div>
                        <div className={'section'}>
                            <h4>Body</h4>
                            {renderBody(response.body)}
                        </div>
                    </TabPage>
                )}
            </TabContainer>
        </div>
    );
};
