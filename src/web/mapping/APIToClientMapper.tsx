/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React, { PropsWithChildren, forwardRef, useState } from 'react';
import type { RESTResource, RESTResourceSpec } from '../types';
import type { DSLControllerMethod, MappedMethod } from './types';
import { ItemTypes } from './types';
import { ConnectionMethodsMapping, ResourceTypeProviderMappingProps } from '@kapeta/ui-web-types';
import { DSLDiffEditor, DnDContainer, DnDDrag, DnDDrop, FormReadyHandler, Tooltip } from '@kapeta/ui-web-components';
import RestMethodView from '../RestMethodView';
import { toRESTKindContext } from '../types';
import { useMappingHandlerBuilder } from './useMappingHandlerBuilder';

import { DSLData } from '@kapeta/kaplang-core';
import { Alert, AlertTitle, Box, Button, Divider, IconButton, Stack, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const colorGrayXLight = '#fafafa';
const colorGrayLight = '#efefef';
const colorGreenDark = '#2d8e2b';

interface RestResourceToClientMapperProps
    extends ResourceTypeProviderMappingProps<RESTResourceSpec, RESTResourceSpec, ConnectionMethodsMapping, DSLData> {}

const MappingSeparator = (props: React.ComponentProps<typeof Stack>) => (
    <Stack
        {...props}
        direction="row"
        className={'mapping-seperator'}
        sx={{
            flex: 0,
            '& .MuiSvgIcon-root': {
                margin: 'auto',
                width: '18px',
                height: '18px',
                aspectRatio: '1',
                p: 0,
            },
            ...props.sx,
        }}
    />
);

const ActionButton = (props: React.ComponentProps<typeof IconButton>) => (
    <IconButton
        {...props}
        sx={{
            ...props.sx,
            '&.MuiButtonBase-root, & .MuiSvgIcon-root, ': {
                margin: 'auto',
                width: '18px',
                height: '18px',
                aspectRatio: '1',
                p: 0,
            },
        }}
    />
);

const MethodColumnBare = (props: React.ComponentProps<typeof Box>, ref: React.Ref<HTMLDivElement>) => (
    <Stack
        direction="row"
        justifyContent="space-between"
        alignItems={'center'}
        {...props}
        className={'method-column ' + (props.className || '')}
        sx={{
            p: 1,
            flexGrow: 1,
            flexBasis: '80px',
            overflow: 'hidden',
            ...props.sx,
        }}
        ref={ref}
    >
        {props.children}
    </Stack>
);
const MethodColumn = forwardRef(MethodColumnBare);

const MethodRow = (props: {
    method: MappedMethod;
    methodId: number;
    mappingHandler: ReturnType<typeof useMappingHandlerBuilder>['mappingHandler'];
    canAddToSource: boolean;
}) => {
    const { method, methodId, mappingHandler } = props;
    const methodMappingClassName = ['method-mapping', method.mapped ? 'mapped' : 'unmapped'].filter(Boolean);
    const [showDiffEditor, setShowDiffEditor] = useState(true);

    const renderInnerSourceColumn = (mappedMethod: MappedMethod, draggable: boolean, droppable: boolean) => {
        const sourceClassNames = ['source'];

        if (draggable) {
            sourceClassNames.push('draggable');
        } else if (droppable) {
            sourceClassNames.push('dropzone');
        }

        return (
            <MethodColumn
                className={sourceClassNames.join(' ')}
                sx={{
                    opacity: mappedMethod.source ? 1 : 0.3,
                    border: '1px solid',
                    borderColor: mappedMethod.source ? 'transparent' : '#f28f8c',

                    cursor: draggable ? 'move' : 'auto',

                    '&.dnd-zone-dragging': {
                        backgroundColor: colorGrayXLight,
                        borderColor: colorGreenDark,
                    },
                    '&.dnd-zone-hovering': {
                        opacity: 0.6,
                        backgroundColor: colorGreenDark,
                        color: 'white !important',

                        '& span': {
                            color: 'white !important',
                        },
                    },
                    // Show light gray outline in place of original item
                    '&.dragging-source': {
                        backgroundColor: colorGrayXLight,
                        '& .actions, & .rest-method': {
                            visibility: 'hidden',
                        },
                    },
                    // Add background to make the item visible when dragging
                    '&.dragging-handle': {
                        backgroundColor: colorGrayLight,
                        boxShadow: '1px 1px 3px 0px rgba(0, 0, 0, 0.15)',

                        // Attempt animate when dragging
                        animation: '0.2s rot forwards',
                        '@keyframes rot': {
                            '0%': {
                                transform: 'rotate(0deg)',
                            },
                            '100%': {
                                transform: 'rotate(1deg)',
                            },
                        },

                        '& .actions': {
                            pointerEvents: 'none',
                            opacity: 0.2,
                        },
                    },
                }}
            >
                {mappedMethod.source && <RestMethodView compact={true} method={mappedMethod.source} />}

                {!mappedMethod.source && mappedMethod.target && (
                    <RestMethodView compact={true} method={mappedMethod.target} />
                )}

                {mappedMethod.mapped && !droppable && mappedMethod.target && !mappedMethod.target.copyOf && (
                    <Stack direction="row" justifyContent={'flex-end'} className={'actions'} sx={{ width: 30 }}>
                        <ActionButton
                            type={'button'}
                            title={'Disconnect'}
                            onClick={() => mappingHandler.removeSource(methodId)}
                        >
                            <ClearIcon />
                        </ActionButton>
                    </Stack>
                )}
            </MethodColumn>
        );
    };

    const renderSourceColumn = (mappedMethod: MappedMethod) => {
        const draggable: boolean = !!mappedMethod.source && !mappedMethod.mapped;
        const dropZone: boolean = !mappedMethod.source && !!mappedMethod.target;

        if (dropZone) {
            return (
                <DnDDrop
                    type={ItemTypes.API_METHOD}
                    droppable={() => mappingHandler.canDropOnTarget(methodId)}
                    onDrop={(type: string, source: DSLControllerMethod) =>
                        mappingHandler.addMappingForTarget(methodId, source)
                    }
                >
                    {renderInnerSourceColumn(mappedMethod, draggable, dropZone)}
                </DnDDrop>
            );
        }

        if (draggable) {
            return (
                <DnDDrag type={ItemTypes.API_METHOD} value={mappedMethod.source} horizontal={false}>
                    {renderInnerSourceColumn(mappedMethod, draggable, dropZone)}
                </DnDDrag>
            );
        }

        return <>{renderInnerSourceColumn(mappedMethod, draggable, dropZone)}</>;
    };

    return (
        <>
            <Stack
                key={methodId}
                direction={'row'}
                flexWrap={'wrap'}
                className={methodMappingClassName.join(' ')}
                sx={{
                    fontSize: '14px',
                    minHeight: '40px',
                    userSelect: 'none',
                    margin: '5px 0 5px -15px',
                    '&:hover': {
                        backgroundColor: '#f5f5f5',
                    },
                    position: 'relative',
                }}
            >
                {renderSourceColumn(method)}

                <MappingSeparator>
                    {method.mapped && (!method.errors || method.errors.length === 0) ? (
                        <CheckCircleIcon color="success" />
                    ) : null}
                    {method.errors && method.errors.length ? (
                        <Tooltip
                            title={
                                method.errors ? (
                                    <>
                                        <p>Mapping errors found:</p>
                                        <ul style={{ marginLeft: 0, paddingLeft: '1em' }}>
                                            {method.errors.map((m) => (
                                                <p key={m}>{m}</p>
                                            ))}
                                        </ul>
                                    </>
                                ) : null
                            }
                        >
                            <ErrorIcon color="error" />
                        </Tooltip>
                    ) : null}

                    {!method.mapped && mappingHandler.canAddToTarget(methodId) && (
                        <ActionButton title={'Add'} onClick={() => mappingHandler.addToTarget(methodId)}>
                            <AddIcon />
                        </ActionButton>
                    )}
                </MappingSeparator>
                <MethodColumn className={'target'}>
                    {method.target && (
                        <>
                            <RestMethodView compact={true} method={method.target} />
                            {method.source && method.target.copyOf && (
                                <div className={'actions'}>
                                    <ActionButton
                                        type={'button'}
                                        title={'Remove method'}
                                        onClick={() => mappingHandler.removeTarget(methodId)}
                                    >
                                        <ClearIcon />
                                    </ActionButton>
                                </div>
                            )}
                            {!method.source && !method.target.copyOf && props.canAddToSource && (
                                <div className={'actions'}>
                                    <ActionButton title={'Add'} onClick={() => mappingHandler.addToSource(methodId)}>
                                        <AddIcon />
                                    </ActionButton>
                                </div>
                            )}
                        </>
                    )}
                </MethodColumn>
                {method.errors?.length ? (
                    <MappingSeparator
                        sx={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translate(100%, -50%)' }}
                    >
                        <ActionButton onClick={() => setShowDiffEditor((open) => !open)}>
                            {showDiffEditor ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </ActionButton>
                    </MappingSeparator>
                ) : null}
            </Stack>

            {showDiffEditor ? (
                <Box sx={{ width: '100%', height: '7em', margin: '8px 0 8px -15px' }}>
                    <DSLDiffEditor entitiesA={[]} entitiesB={[]} readOnly />
                </Box>
            ) : null}
        </>
    );
};

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

    const isValid = () => mappingHandlerContext.entityIssues.length === 0 && mappingHandler.isValid();

    const syncToClient = () => {
        // Delete all target methods and copy all source methods to target
        mappingHandler.methods.forEach((method, ix) => {
            if (method.target && !method.mapped) {
                mappingHandler.removeTarget(ix);
            }
        });
        mappingHandler.methods.forEach((method, ix) => {
            if (method.source && !method.target) {
                mappingHandler.addToTarget(ix);
            }
        });
    };

    const methods = mappingHandler.methods.map((method, ix) => [ix, method] as const);
    const mappedMethods = methods.filter(([_, method]) => method.mapped);
    const unmappedMethods = methods.filter(([_, method]) => !method.mapped);

    const hasIssues = mappingHandlerContext.entityIssues.length > 0 || mappingHandlerContext.warnings.length > 0;

    return (
        <div className={'rest-resource-to-client-mapper-ui'}>
            <FormReadyHandler name={title} ready={isValid()}>
                {hasIssues && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2,
                            pb: 2,
                            '& ul': {
                                paddingInlineStart: '1.5em',
                                m: 0,
                                mt: 1,
                            },
                        }}
                    >
                        <AlertTitle>Mapping error - The following warnings were encountered:</AlertTitle>

                        {mappingHandlerContext.entityIssues.length ? (
                            <Stack className={'content'} gap={2}>
                                <ul>
                                    {mappingHandlerContext.entityIssues.map((error, ix) => {
                                        return <li key={`error_${ix}`}>{error}</li>;
                                    })}
                                </ul>
                                <div>
                                    {"You'll need to correct these issues before you can fully map this connection."}
                                </div>
                            </Stack>
                        ) : null}

                        {mappingHandlerContext.warnings.length > 0 ? (
                            <Stack className={'content'} gap={2}>
                                <ul>
                                    {mappingHandlerContext.warnings.map((error, ix) => {
                                        return <li key={`error_${ix}`}>{error}</li>;
                                    })}
                                </ul>
                            </Stack>
                        ) : null}
                    </Alert>
                )}

                <Stack direction={'row'} justifyContent={'space-between'} sx={{ pb: 2 }}>
                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                        <Typography variant={'h6'}>Connection</Typography>
                        <InfoOutlinedIcon fontSize={'small'} />
                    </Stack>
                    <Button
                        variant={'contained'}
                        disableElevation
                        color="inherit"
                        size="small"
                        startIcon={<SyncAltIcon />}
                        onClick={syncToClient}
                    >
                        Sync to client
                    </Button>
                </Stack>

                <DnDContainer>
                    <Stack>
                        <Stack
                            direction="row"
                            justifyContent={'space-between'}
                            sx={{
                                borderBottom: '1px solid #e5e5e5',
                                pb: 1,
                                my: 1,
                            }}
                        >
                            <MethodColumn className="source">{mappingHandlerContext.sourceName}: REST API</MethodColumn>
                            <MappingSeparator>
                                <SyncAltIcon />
                            </MappingSeparator>
                            <MethodColumn className="target">
                                {mappingHandlerContext.targetName}: REST Client
                            </MethodColumn>
                        </Stack>

                        <div className={'content'}>
                            {mappedMethods.map(([ix, method]) => (
                                <MethodRow
                                    key={ix}
                                    method={method}
                                    methodId={ix}
                                    mappingHandler={mappingHandler}
                                    canAddToSource={mappingHandlerContext.serverWasEmpty}
                                />
                            ))}

                            {unmappedMethods.length && mappedMethods.length ? <Divider /> : null}
                            {unmappedMethods.map(([ix, method]) => (
                                <MethodRow
                                    key={ix}
                                    method={method}
                                    methodId={ix}
                                    mappingHandler={mappingHandler}
                                    canAddToSource={mappingHandlerContext.serverWasEmpty}
                                />
                            ))}
                        </div>
                    </Stack>
                </DnDContainer>
            </FormReadyHandler>
        </div>
    );
};

export default APIToClientMapper;
