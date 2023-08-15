/**
 * @jest-environment jsdom
 */
//This is all needed due to monaco editor getting pulled in
document.queryCommandSupported = function () {
    return false;
};
import { TextEncoder, TextDecoder } from 'util';
global['TextEncoder'] = TextEncoder as any;
global['TextDecoder'] = TextDecoder as any;

import { describe, expect, test } from '@jest/globals';
import { getCounterValue, hasMethod, renameEntityReferences, resolveEntities, validate } from '../src/web/RESTUtils';
import { ENTITIES, makeAPI, makeAPIContext, makeMethod } from './helpers';

describe('RESTUtils', () => {
    test('can get counter value (number of methods in API)', () => {
        expect(getCounterValue(makeAPI({}))).toBe(0);

        expect(
            getCounterValue(
                makeAPI({
                    test1: makeMethod(),
                    test2: makeMethod(),
                    test3: makeMethod(),
                })
            )
        ).toBe(3);
    });

    test('can determine if api has method by name', () => {
        expect(hasMethod(makeAPI({}), 'test')).toBe(false);

        expect(
            hasMethod(
                makeAPI({
                    test1: makeMethod(),
                    test2: makeMethod(),
                    test3: makeMethod(),
                }),
                'test'
            )
        ).toBe(false);

        expect(
            hasMethod(
                makeAPI({
                    test1: makeMethod(),
                    test2: makeMethod(),
                    test3: makeMethod(),
                }),
                'test1'
            )
        ).toBe(true);
    });

    test('can resolve all entities from methods', () => {
        expect(
            resolveEntities(
                makeAPIContext({
                    test1: makeMethod(),
                    test2: makeMethod(),
                    test3: makeMethod(),
                })
            )
        ).toEqual([]);

        expect(
            resolveEntities(
                makeAPIContext({
                    test1: makeMethod([{ ref: 'User' }, 'string']),
                    test2: makeMethod([], { ref: 'Person' }),
                    test3: makeMethod(['string', { ref: 'Staff' }]),
                })
            )
        ).toEqual(['User', 'Person', 'Staff']);
    });

    test('can rename reference', () => {
        const api = makeAPI({
            test1: makeMethod([{ ref: 'User' }, 'string']),
            test2: makeMethod([], { ref: 'Person[]' }),
            test3: makeMethod(['string', { ref: 'Staff' }]),
        });

        expect(api.spec.methods?.test1?.arguments?.arg_0?.ref).toBe('User');
        renameEntityReferences(api, 'User', 'UserInformation');
        expect(api.spec.methods?.test1?.arguments?.arg_0?.ref).toBe('UserInformation');

        expect(api.spec.methods?.test2?.responseType?.ref).toBe('Person[]');
        renameEntityReferences(api, 'Person', 'PersonInfo');
        expect(api.spec.methods?.test2?.responseType?.ref).toBe('PersonInfo[]');
    });

    describe('validation', () => {
        test('fails validation if entity is not found', () => {
            expect(
                validate(
                    makeAPIContext(
                        {
                            test: makeMethod([{ ref: 'Company' }], { ref: 'Department' }),
                        },
                        ENTITIES
                    )
                )
            ).toEqual([
                'Multiple entities are not defined in this block: Department, Company. Create these entities to solve this issue',
            ]);
        });

        test('fails if path is empty', () => {
            const method = makeMethod();
            method.path = '';

            expect(
                validate(
                    makeAPIContext(
                        {
                            test: method,
                        },
                        ENTITIES
                    )
                )
            ).toEqual(['test is missing path. Add path to solve this issue']);
        });

        test('fails if method is empty', () => {
            const method: any = makeMethod();
            method.method = null;

            expect(
                validate(
                    makeAPIContext(
                        {
                            test: method,
                        },
                        ENTITIES
                    )
                )
            ).toEqual(['test is missing HTTP method. Define an HTTP method to solve this issue']);
        });

        test('fails if argument type is empty', () => {
            const method: any = makeMethod(['string', 'float']);
            delete method.arguments.arg_0.type;
            expect(
                validate(
                    makeAPIContext(
                        {
                            test: method,
                        },
                        ENTITIES
                    )
                )
            ).toEqual([
                'test is missing a type and/or a transport for the following arguments: arg_0. Add type and transport to all arguments to solve this issue.',
            ]);
        });

        test('fails if argument transport is empty', () => {
            const method: any = makeMethod(['string', 'float']);
            delete method.arguments.arg_0.transport;
            expect(
                validate(
                    makeAPIContext(
                        {
                            test: method,
                        },
                        ENTITIES
                    )
                )
            ).toEqual([
                'test is missing a type and/or a transport for the following arguments: arg_0. Add type and transport to all arguments to solve this issue.',
            ]);
        });

        test('passes if valid method is supplied', () => {
            const method: any = makeMethod(['string', 'float'], 'void');

            expect(
                validate(
                    makeAPIContext(
                        {
                            test: method,
                        },
                        ENTITIES
                    )
                )
            ).toEqual([]);
        });

        test('passes if method has no arguments', () => {
            const method: any = makeMethod([], 'void');
            delete method.arguments;

            expect(
                validate(
                    makeAPIContext(
                        {
                            test: method,
                        },
                        ENTITIES
                    )
                )
            ).toEqual([]);
        });
    });
});
