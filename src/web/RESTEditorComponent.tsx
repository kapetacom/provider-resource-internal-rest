/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';

import {
    DSLConverters,
    MethodEditor,
    FormField,
    useFormContextField,
    useIsFormSubmitAttempted,
    DSLMethod,
} from '@kapeta/ui-web-components';

import { KAPLANG_ID } from '@kapeta/kaplang-core';

import type { ResourceTypeProviderEditorProps } from '@kapeta/ui-web-types';

import { validateApiName } from './RESTUtils';
import { Alert, Stack } from '@mui/material';

export const RESTEditorComponent = (props: ResourceTypeProviderEditorProps) => {
    const methodField = useFormContextField('spec.methods');
    const methodSource = useFormContextField('spec.source');
    const [methodsError, setMethodsError] = React.useState<string | null>(null);
    const formSubmitAttempted = useIsFormSubmitAttempted();

    const setResult = (code: string, methods: DSLMethod[]) => {
        try {
            methodField.set(DSLConverters.toSchemaMethods(methods));
            methodSource.set({ type: KAPLANG_ID, value: code });
        } catch (e) {
            console.error('Failed to trigger change', e);
        }
    };

    const validTypes = props.block.spec.entities?.types?.map((t) => t.name) ?? [];

    const source = methodSource.get({ value: '' });
    const entities = DSLConverters.fromSchemaMethods(methodField.get({}));

    return (
        <Stack className={'rest-resource-editor'} sx={{ height: '100%' }}>
            <FormField
                name={'metadata.name'}
                label={'Name'}
                validation={['required', validateApiName]}
                help={'Name your REST API. E.g. MyApi'}
            />

            <Stack
                sx={{
                    height: '100%',
                    '.dsl-editor': {
                        boxSizing: 'border-box',
                    },
                }}
                className={'editor'}
            >
                <MethodEditor
                    restMethods={true}
                    validTypes={validTypes}
                    onError={(err: any) => {
                        methodSource.invalid();
                        setMethodsError(err.message);
                    }}
                    value={{
                        code: source.value,
                        entities,
                    }}
                    onChange={(result:any) => {
                        methodSource.valid();
                        setResult(result.code, result.entities as DSLMethod[]);
                    }}
                />
                {methodsError && formSubmitAttempted && (
                    <Alert sx={{ mt: 1 }} severity={'error'}>
                        {methodsError}
                    </Alert>
                )}
            </Stack>
        </Stack>
    );
};
