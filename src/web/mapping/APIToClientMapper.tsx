import React from 'react';
import type { RESTMethodEdit, RESTResource, RESTResourceSpec } from '../types';
import type { MappedMethod } from './types';
import { ItemTypes } from './types';
import { ConnectionMethodsMapping, ResourceTypeProviderMappingProps } from '@kapeta/ui-web-types';
import { DnDContainer, DnDDrag, DnDDrop, FormReadyHandler } from '@kapeta/ui-web-components';
import RestMethodView from '../RestMethodView';
import { toRESTKindContext } from '../types';
import { useMappingHandlerBuilder } from './useMappingHandlerBuilder';

import './APIToClientMapper.less';

const DangerIcon: React.FC = () => (
    <svg width="42" height="42" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="white" fillOpacity="0.4" />
        <path d="M21.5146 10L9.99989 21.5148" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 10L21.5148 21.5148" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

interface RestResourceToClientMapperProps
    extends ResourceTypeProviderMappingProps<RESTResourceSpec, RESTResourceSpec, ConnectionMethodsMapping> {
}

const APIToClientMapper: React.FC<RestResourceToClientMapperProps> = ({
    title,
    source,
    sourceEntities,
    target,
    targetEntities,
    value,
    onDataChanged,
}) => {
    const { mappingHandler, ...mappingHandlerContext } = useMappingHandlerBuilder(
        toRESTKindContext(source as RESTResource, sourceEntities),
        toRESTKindContext(target as RESTResource, targetEntities),
        value,
        onDataChanged
    );

    const isValid = () => mappingHandlerContext.issues.length === 0 && mappingHandler.isValid();

    const renderInnerSourceColumn = (
        ix: number,
        mappedMethod: MappedMethod,
        draggable: boolean,
        droppable: boolean
    ) => {
        const sourceClassNames = ['source'];

        if (draggable) {
            sourceClassNames.push('draggable');
        } else if (droppable) {
            sourceClassNames.push('dropzone');
        }

        return (
            <div className={sourceClassNames.join(' ')}>
                {mappedMethod.source && <RestMethodView compact={true} method={mappedMethod.source} />}

                {!mappedMethod.source && mappedMethod.target && (
                    <RestMethodView compact={true} method={mappedMethod.target} />
                )}

                {mappedMethod.mapped && !droppable && mappedMethod.target && !mappedMethod.target.copyOf && (
                    <div className={'actions'}>
                        <button
                            type={'button'}
                            className={'button icon danger'}
                            title={'Disconnect'}
                            onClick={() => mappingHandler.removeSource(ix)}
                        >
                            <i className={'fas fa-times'} />
                        </button>
                    </div>
                )}

                {!mappedMethod.mapped && !droppable && mappingHandler.canAddToTarget(ix) && (
                    <div className={'actions'}>
                        <button
                            type={'button'}
                            className={'button icon friendly'}
                            title={'Add'}
                            onClick={() => mappingHandler.addToTarget(ix)}
                        >
                            <i className={'fas fa-plus'} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderSourceColumn = (ix: number, mappedMethod: MappedMethod) => {
        const draggable: boolean = !!mappedMethod.source && !mappedMethod.mapped;
        const dropZone: boolean = !mappedMethod.source && !!mappedMethod.target;

        if (dropZone) {
            return (
                <DnDDrop
                    type={ItemTypes.API_METHOD}
                    droppable={() => mappingHandler.canDropOnTarget(ix)}
                    onDrop={(type, source: RESTMethodEdit) => mappingHandler.addMappingForTarget(ix, source)}
                >
                    {renderInnerSourceColumn(ix, mappedMethod, draggable, dropZone)}
                </DnDDrop>
            );
        }

        if (draggable) {
            return (
                <DnDDrag type={ItemTypes.API_METHOD} value={mappedMethod.source} horizontal={false}>
                    {renderInnerSourceColumn(ix, mappedMethod, draggable, dropZone)}
                </DnDDrag>
            );
        }

        return <>{renderInnerSourceColumn(ix, mappedMethod, draggable, dropZone)}</>;
    };

    return (
        <div className={'rest-resource-to-client-mapper'}>
            <FormReadyHandler name={title} ready={isValid()}>
                {mappingHandlerContext.issues.length > 0 && (
                    <div className={'issues'}>
                        <DangerIcon />
                        <div className={'content'}>
                            <div>Identified the following incompatibility issues with entities in this connection:</div>
                            <ul>
                                {mappingHandlerContext.issues.map((error, ix) => {
                                    return <li key={`error_${ix}`}>{error}</li>;
                                })}
                            </ul>
                            <div>{"You'll need to correct these issues before you can fully map this connection."}</div>
                        </div>
                    </div>
                )}

                {mappingHandlerContext.warnings.length > 0 && (
                    <div className={'warnings'}>
                        <div>The following warnings were encountered when reading connection mapping:</div>
                        <div className={'content'}>
                            <ul>
                                {mappingHandlerContext.warnings.map((error, ix) => {
                                    return <li key={`error_${ix}`}>{error}</li>;
                                })}
                            </ul>
                        </div>
                    </div>
                )}

                <div className={'header'}>
                    <div className={'source'}>{mappingHandlerContext.sourceName}: REST API</div>
                    <div className={'mapping-seperator'}></div>
                    <div className={'target'}>{mappingHandlerContext.targetName}: REST Client</div>
                </div>
                <DnDContainer>
                    <div className={'content'}>
                        {mappingHandler.methods.map((method, ix) => {
                            const methodMappingClassName = ['method-mapping'];

                            methodMappingClassName.push(method.mapped ? 'mapped' : 'unmapped');

                            if (!method.source && method.target) {
                                methodMappingClassName.push('unmapped-source');
                            }

                            if (!method.target && method.source) {
                                methodMappingClassName.push('unmapped-target');
                            }

                            return (
                                <div key={ix} className={methodMappingClassName.join(' ')}>
                                    {renderSourceColumn(ix, method)}

                                    <div className={'mapping-seperator'}>
                                        {method.mapped && (
                                            <i title={'Mapped succesfully'} className={'fas fa-chevron-right'} />
                                        )}

                                        {!method.source && method.target && (
                                            <i title={'Missing mapping'} className={'fas fa-exclamation-triangle'} />
                                        )}
                                    </div>
                                    <div className={'target'}>
                                        {method.target && (
                                            <>
                                                <RestMethodView compact={true} method={method.target} />
                                                {method.source && method.target.copyOf && (
                                                    <div className={'actions'}>
                                                        <button
                                                            type={'button'}
                                                            className={'button icon danger'}
                                                            title={'Remove method'}
                                                            onClick={() => mappingHandler.removeTarget(ix)}
                                                        >
                                                            <i className={'fas fa-times'} />
                                                        </button>
                                                    </div>
                                                )}
                                                {!method.source &&
                                                    !method.target.copyOf &&
                                                    mappingHandlerContext.serverWasEmpty && (
                                                        <div className={'actions'}>
                                                            <button
                                                                type={'button'}
                                                                className={'button icon friendly'}
                                                                title={'Add'}
                                                                onClick={() => mappingHandler.addToSource(ix)}
                                                            >
                                                                <i className={'fas fa-plus'} />
                                                            </button>
                                                        </div>
                                                    )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DnDContainer>
            </FormReadyHandler>
        </div>
    );
};

export default APIToClientMapper;
