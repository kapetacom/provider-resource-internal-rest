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

import {DSLData, DSLDataTypeParser, KAPLANG_ID, KAPLANG_VERSION} from '@kapeta/kaplang-core';

import { IncludeContextType, ResourceTypeProviderEditorProps } from '@kapeta/ui-web-types';

import { validateApiName } from './RESTUtils';
import { Alert, Stack } from '@mui/material';
import { SourceCode } from '@kapeta/schemas';

const typeNameMapper = (e:DSLData) => {
    return DSLTypeHelper.asFullName(e, true);
};

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
        let includeTypes:string[] = [];
        if (props.context?.languageProvider && props.context?.languageProvider.getDSLIncludes) {
            // The language target might provide some additional types
            const include = props.context.languageProvider.getDSLIncludes(IncludeContextType.REST);
            if (include?.source) {
                try {
                    includeTypes = DSLDataTypeParser.parse(include?.source).map(typeNameMapper);
                } catch (e) {
                    console.error('Failed to parse include types', e);
                }
            }
        }

        if (props.block?.spec?.entities?.source?.value) {
            let types:DSLData[] = [];
            try {
                types = DSLDataTypeParser.parse(props.block.spec.entities.source.value, {
                    validTypes: includeTypes,
                });
            } catch (e) {
                console.error('Failed to parse types', e);
            }

            includeTypes = Array.from(new Set<string>(types.map(typeNameMapper).concat(includeTypes)));
        }

        if (includeTypes.length > 0) {
            return includeTypes;
        }

        return props.block.spec.entities?.types?.map((t) => t.name) ?? [];
    }, [props.block.spec.entities?.source, props.context?.languageProvider]);

    const source = methodSource.get({ value: '', type: KAPLANG_ID, version: KAPLANG_VERSION });
    const entities = DSLConverters.fromSchemaMethods(methodField.get({}));

    return (
        <Stack sx={{ height: '100%' }}>
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
