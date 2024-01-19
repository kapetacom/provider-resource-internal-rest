import { describe, expect, test } from '@jest/globals';
import {
    convertToEditMethod,
    convertToRestMethod,
    getCompatibleRESTMethodsIssues,
    isCompatibleRESTMethods,
} from '../src/web/types';
import { HTTPMethod } from '@kapeta/ui-web-types';
import { ENTITIES, ENTITIES_ALT, makeEditContext, makeMethod } from './helpers';

describe('Types', () => {
    test('can convert to edit method', () => {
        expect(convertToEditMethod('test1', makeMethod(['string', { ref: 'User' }], 'string'))).toEqual({
            id: 'test1',
            description: '',
            method: HTTPMethod.POST,
            arguments: [
                {
                    id: 'arg_0',
                    type: 'string',
                    transport: 'QUERY',
                    optional: false,
                },
                {
                    id: 'arg_1',
                    ref: 'User',
                    transport: 'BODY',
                    optional: false,
                },
            ],
            path: '/',
            responseType: { type: 'string' },
        });
    });

    test('can convert to rest method from edit method', () => {
        expect(
            convertToRestMethod({
                id: 'test1',
                description: '',
                method: HTTPMethod.POST,
                arguments: [
                    {
                        id: 'arg_0',
                        type: 'string',
                        transport: 'QUERY',
                        optional: false,
                    },
                    {
                        id: 'arg_1',
                        ref: 'User',
                        transport: 'BODY',
                        optional: false,
                    },
                ],
                path: '/',
                responseType: { type: 'string' },
            })
        ).toEqual(makeMethod(['string', { ref: 'User' }], 'string'));
    });

    describe('compatibility', () => {
        test('simple methods are equal', () => {
            expect(isCompatibleRESTMethods(makeEditContext('test1'), makeEditContext('test2'))).toBe(true);

            expect(isCompatibleRESTMethods(makeEditContext('test1', [], 'void'), makeEditContext('test2'))).toBe(true);

            expect(
                isCompatibleRESTMethods(
                    makeEditContext('test1', ['string', 'float']),
                    makeEditContext('test2', ['float', 'string'], 'void')
                )
            ).toBe(true);
        });

        test('simple arguments must match', () => {
            expect(isCompatibleRESTMethods(makeEditContext('test1', ['string']), makeEditContext('test2'))).toBe(false);

            expect(
                isCompatibleRESTMethods(makeEditContext('test1', ['string']), makeEditContext('test2', ['string']))
            ).toBe(true);

            expect(
                isCompatibleRESTMethods(makeEditContext('test1', ['string']), makeEditContext('test2', ['byte']))
            ).toBe(false);
        });

        test('methods with response type void requires match', () => {
            expect(
                isCompatibleRESTMethods(makeEditContext('test1', [], 'void'), makeEditContext('test2', [], 'string'))
            ).toBe(false);

            expect(
                getCompatibleRESTMethodsIssues(
                    makeEditContext('test1', [], 'void'),
                    makeEditContext('test2', [], 'string')
                )
            ).toEqual(['Response types are not compatible']);

            expect(isCompatibleRESTMethods(makeEditContext('test1', [], 'string'), makeEditContext('test2', []))).toBe(
                false
            );

            expect(
                isCompatibleRESTMethods(makeEditContext('test1', [], 'string'), makeEditContext('test2', [], 'float'))
            ).toBe(true);

            expect(
                isCompatibleRESTMethods(makeEditContext('test1', [], 'string'), makeEditContext('test2', [], 'string'))
            ).toBe(true);
        });

        test('arguments with missing entities does not match', () => {
            expect(
                isCompatibleRESTMethods(
                    makeEditContext('test1', [{ ref: 'NotReal' }], 'string'),
                    makeEditContext('test2', [{ ref: 'NotReal' }], 'string')
                )
            ).toBe(false);

            expect(
                getCompatibleRESTMethodsIssues(
                    makeEditContext('test1', [{ ref: 'NotReal' }], 'string'),
                    makeEditContext('test2', [{ ref: 'NotReal' }], 'string')
                )
            ).toEqual(['Argument 1 type is not compatible: NotReal was not defined']);
        });

        test('arguments with same entity name but different structure does not match', () => {
            expect(
                isCompatibleRESTMethods(
                    makeEditContext('test1', [{ ref: 'User' }], 'string', ENTITIES),
                    makeEditContext('test2', [{ ref: 'User' }], 'string', ENTITIES_ALT)
                )
            ).toBe(false);

            expect(
                getCompatibleRESTMethodsIssues(
                    makeEditContext('test1', [{ ref: 'User' }], 'string', ENTITIES),
                    makeEditContext('test2', [{ ref: 'User' }], 'string', ENTITIES_ALT)
                )
            ).toEqual(['Argument 1 type is not compatible: Property not found: id']);
        });

        test('arguments with same entity name and structure does match', () => {
            const aMethod = makeEditContext('test1', [{ ref: 'User' }], 'string', ENTITIES);
            const bMethod = makeEditContext('test2', [{ ref: 'User' }], 'string', ENTITIES);

            expect(isCompatibleRESTMethods(aMethod, bMethod)).toBe(true);

            delete aMethod.method.arguments[0].optional;
            bMethod.method.arguments[0].optional = false;
            expect(isCompatibleRESTMethods(aMethod, bMethod)).toBe(true);
        });

        test('arguments with same type but not both required does not match', () => {
            const aMethod = makeEditContext('test1', [{ ref: 'User' }], 'string', ENTITIES);
            const bMethod = makeEditContext('test2', [{ ref: 'User' }], 'string', ENTITIES);
            aMethod.method.arguments[0].optional = true;
            expect(isCompatibleRESTMethods(aMethod, bMethod)).toBe(false);

            expect(getCompatibleRESTMethodsIssues(aMethod, bMethod)).toEqual([
                'Argument 1 is not compatible because one is optional and the other is not',
            ]);
        });

        test('response type with same entity name but different structure does not match', () => {
            expect(
                isCompatibleRESTMethods(
                    makeEditContext('test1', [], { ref: 'User' }, ENTITIES),
                    makeEditContext('test2', [], { ref: 'User' }, ENTITIES_ALT)
                )
            ).toBe(false);

            expect(
                getCompatibleRESTMethodsIssues(
                    makeEditContext('test1', [], { ref: 'User' }, ENTITIES),
                    makeEditContext('test2', [], { ref: 'User' }, ENTITIES_ALT)
                )
            ).toEqual(['Response types are not compatible']);
        });

        test('response type with same entity name and structure does match', () => {
            expect(
                isCompatibleRESTMethods(
                    makeEditContext('test1', [], { ref: 'User' }, ENTITIES),
                    makeEditContext('test2', [], { ref: 'User' }, ENTITIES)
                )
            ).toBe(true);
        });
    });
});
