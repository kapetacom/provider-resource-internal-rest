import React, { Component } from 'react';

import { Traffic } from '@blockware/ui-web-context';
import {TabContainer, TabPage} from "@blockware/ui-web-components";
import {httpStatusPhrase} from "@blockware/ui-web-utils";

import "./InspectConnectionPayload.less";

interface InspectTrafficPayloadProps {
    traffic:Traffic
}

interface InspectTrafficPayloadState {
    activeTab: 1
}

export default class InspectConnectionPayload extends Component<InspectTrafficPayloadProps, InspectTrafficPayloadState> {

    private renderHeaders(headers: {[key:string]:string}) {

        return (
            Object.keys(headers).map((headerKey: string) => {
                return (
                    <tr>
                        <th>{headerKey}</th>
                        <td>{headers[headerKey]}</td>
                    </tr>
                );
            })
        )
    }

    private renderBody(body?: string) {
        return (
            <pre className={'body'}>{body || <em>No body available</em>}</pre>
        )
    }

    render() {
        const response = this.props.traffic.response;
        const request = this.props.traffic.request;

        return (
            <div className={"inspect-connection-payload"}>
                <div className={'overview'}>

                    <span className="method">
                        {request.method}
                    </span>
                    <span className="url">
                        {request.url}
                    </span>

                    <span className={'status'}>
                    {response ?
                        <><span className={'code'}>{response.code}</span><em>( {httpStatusPhrase(response.code)} )</em></>
                        :
                        'Pending'
                    }
                    </span>

                </div>

                <TabContainer>

                    <TabPage id={'request'} title={'Request'}>
                        <div className={'section'}>
                            <h4>Headers</h4>
                            <table cellSpacing={0} className={'headers'}>
                                <tbody>
                                {this.renderHeaders(request.headers)}
                                </tbody>
                            </table>
                        </div>
                        <div className={'section'}>
                            <h4>Body</h4>
                            {this.renderBody(request.body)}
                        </div>
                    </TabPage>

                    {response &&
                        <TabPage id={'response'} title={'Response'}>
                            <div className={'section'}>
                                <h4>Headers</h4>
                                <table cellSpacing={0} className={'headers'}>
                                    <tbody>
                                        {this.renderHeaders(response.headers)}
                                    </tbody>
                                </table>
                            </div>
                            <div className={'section'}>
                                <h4>Body</h4>
                                {this.renderBody(response.body)}
                            </div>
                        </TabPage>
                    }
                </TabContainer>
            </div>
        )
    }

}