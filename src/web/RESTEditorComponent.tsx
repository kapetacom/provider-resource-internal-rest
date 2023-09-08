import React from 'react';

import {
    DSL_LANGUAGE_ID,
    DSLConverters,
    DSLMethod,
    MethodEditor,
    FormField,
    useFormContextField,
} from '@kapeta/ui-web-components';
import type { ResourceTypeProviderEditorProps } from '@kapeta/ui-web-types';

import './RESTEditorComponent.less';
import { validateApiName } from './RESTUtils';


export const RESTEditorComponent = (props: ResourceTypeProviderEditorProps) => {
    const methodField = useFormContextField('spec.methods');
    const methodSource = useFormContextField('spec.source');

    const setResult = (code: string, methods: DSLMethod[]) => {
        try {
            methodField.set(DSLConverters.toSchemaMethods(methods));
            methodSource.set({ type: DSL_LANGUAGE_ID, value: code });
        } catch (e) {
            console.error('Failed to trigger change', e);
        }
    };

    const validTypes = props.block.spec.entities?.types?.map((t) => t.name) ?? [];

    return (
        <div className={'rest-resource-editor'}>
            <FormField
                name={'metadata.name'}
                label={'Name'}
                validation={['required', validateApiName]}
                help={'Name your REST API. E.g. MyApi'}
            />

            <div className={'editor'}>
                <MethodEditor
                    restMethods={true}
                    validTypes={validTypes}
                    value={{
                        code: methodSource.get({ value: '' }).value,
                        entities: DSLConverters.fromSchemaMethods(methodField.get([])),
                    }}
                    onChange={(result) => {
                        setResult(result.code, result.entities as DSLMethod[]);
                    }}
                />
            </div>
        </div>
    );
};
