/**
 * Copyright 2024 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

export type InspectConnectionPageType = 'methods' | 'requests' | 'payload';

export interface ConnectionMethod {
    providerName: string;
    consumerName: string;
    stats: ConnectionMethodStatusCodes;
}

export interface ConnectionMethodStatusCodes {
    requests: number;
    sc2xx: number;
    sc3xx: number;
    sc4xx: number;
    sc5xx: number;
}
