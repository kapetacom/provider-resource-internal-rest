/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { useMemo } from 'react';

import {
    DSLConverters,
    DSLMethod,
    DSLTypeHelper,
    FormField,
    MethodEditor,
    useFormContextField,
    useIsFormSubmitAttempted,
} from '@kapeta/ui-web-components';

import { DSLDataTypeParser, KAPLANG_ID, KAPLANG_VERSION } from '@kapeta/kaplang-core';

import { IncludeContextType, ResourceTypeProviderEditorProps } from '@kapeta/ui-web-types';

import { validateApiName } from './RESTUtils';
import { Alert, Stack } from '@mui/material';
import { SourceCode } from '@kapeta/schemas';

export const RESTEditorComponent = (props: ResourceTypeProviderEditorProps) => {
    const methodField = useFormContextField('spec.methods');
    const methodSource = useFormContextField<SourceCode>('spec.source');
    const [methodsError, setMethodsError] = React.useState<string | null>(null);
    const formSubmitAttempted = useIsFormSubmitAttempted();

    const setResult = (code: string, methods: DSLMethod[]) => {
        try {
            methodField.set(DSLConverters.toSchemaMethods(methods));
            methodSource.set({ type: KAPLANG_ID, version: KAPLANG_VERSION, value: code });
        } catch (e) {
            console.error('Failed to trigger change', e);
        }
    };

    const validTypes = useMemo(() => {
        let typeCode: string[] = [];
        if (props.context?.languageProvider && props.context?.languageProvider.getDSLIncludes) {
            // The language target might provide some additional types
            const include = props.context?.languageProvider.getDSLIncludes(IncludeContextType.REST);
            if (include?.source) {
                typeCode.push(include.source);
            }
        }

        if (props.block.spec.entities?.source?.value) {
            typeCode.push(props.block.spec.entities.source.value);
        }

        if (typeCode.length > 0) {
            const types = DSLDataTypeParser.parse(typeCode.join('\n\n'));

            return types.map((e) => {
                return DSLTypeHelper.asFullName(e, true);
            });
        }

        return props.block.spec.entities?.types?.map((t) => t.name) ?? [];
    }, [props.block.spec.entities?.source, props.context?.languageProvider]);

    console.log('validTypes', validTypes);

    const source = methodSource.get({ value: '', type: KAPLANG_ID, version: KAPLANG_VERSION });
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
                    onChange={(result: any) => {
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
