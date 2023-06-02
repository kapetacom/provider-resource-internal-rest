import React, {Component} from 'react';

import {observer} from 'mobx-react';

import {StackContainer, StackPage} from '@kapeta/ui-web-components';

import InspectConnectionMethods from './InspectConnectionMethods';
import InspectConnectionTraffic from './InspectConnectionTraffic';
import InspectConnectionPayload from './InspectConnectionPayload';
import type {ResourceTypeProviderInspectorProps, Traffic} from '@kapeta/ui-web-types';

interface InspectConnectionContentState {
    currentPageId: string;
    selectedMethod?: string;
    selectedPayload?: Traffic;
}

@observer
export default class InspectConnectionContent extends Component<
    ResourceTypeProviderInspectorProps,
    InspectConnectionContentState
> {
    constructor(props: ResourceTypeProviderInspectorProps) {
        super(props);
        this.state = {
            currentPageId: 'methods',
        };
    }

    private showTraffic(method: string) {
        this.setState({selectedMethod: method, currentPageId: 'traffic'});
    }

    private showPayload(traffic: Traffic) {
        this.setState({selectedPayload: traffic, currentPageId: 'payload'});
    }

    private onPageRequest(pageId: string) {
        switch (pageId) {
            case 'methods':
                this.setState({
                    currentPageId: pageId,
                    selectedPayload: undefined,
                    selectedMethod: undefined,
                });
                break;
            case 'traffic':
                this.setState({
                    currentPageId: pageId,
                    selectedPayload: undefined,
                });
                break;
            case 'payloads':
                break;
        }
    }

    render() {
        return (
            <StackContainer
                currentPageId={this.state.currentPageId}
                onPageRequest={(pageId) => this.onPageRequest(pageId)}
            >
                <StackPage id={'methods'} title={'Overview'}>
                    <InspectConnectionMethods
                        onMethodClick={(method: string) => {
                            this.showTraffic(method);
                        }}
                        mapping={this.props.mapping}
                        trafficLines={this.props.trafficLines}
                    />
                </StackPage>

                {this.state.selectedMethod && (
                    <StackPage id={'traffic'} title={'Traffic'}>
                        <InspectConnectionTraffic
                            trafficLines={this.props.trafficLines.filter(
                                (traffic) => traffic.providerMethodId === this.state.selectedMethod
                            )}
                            providerMethod={this.state.selectedMethod}
                            onTrafficClick={(traffic: Traffic) => {
                                this.showPayload(traffic);
                            }}
                        />
                    </StackPage>
                )}

                {this.state.selectedPayload && (
                    <StackPage id={'payload'} title={'Payload'}>
                        <InspectConnectionPayload traffic={this.state.selectedPayload} />
                    </StackPage>
                )}
            </StackContainer>
        );
    }
}
