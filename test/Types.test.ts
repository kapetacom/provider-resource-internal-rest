import { describe, expect, test } from '@jest/globals';
import { getCompatibleRESTMethodsIssues, isCompatibleRESTMethods } from '../src/web/types';

import { ENTITIES, ENTITIES_ALT, makeEditContext } from './helpers';

describe('Types', () => {
    describe('compatibility', () => {
        test('simple methods are equal', () => {
            expect(getCompatibleRESTMethodsIssues(makeEditContext('test1'), makeEditContext('test2'))).toEqual([]);

            expect(
                getCompatibleRESTMethodsIssues(makeEditContext('test1', [], 'void'), makeEditContext('test2'))
            ).toEqual([]);

            expect(
                getCompatibleRESTMethodsIssues(
                    makeEditContext('test1', ['string', 'float']),
                    makeEditContext('test2', ['float', 'string'], 'void')
                )
            ).toEqual([]);
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
                getCompatibleRESTMethodsIssues(
                    makeEditContext('test1', [], 'void'),
                    makeEditContext('test2', [], 'string')
                )
            ).toEqual(['Response types are not compatible', 'Types are not both void']);

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

        test('arguments with same entity name but different structure does not match', () => {
            expect(
                isCompatibleRESTMethods(
                    makeEditContext('test1', ['User'], 'string', ENTITIES),
                    makeEditContext('test2', ['User'], 'string', ENTITIES_ALT)
                )
            ).toBe(false);

            expect(
                getCompatibleRESTMethodsIssues(
                    makeEditContext('test1', ['User'], 'string', ENTITIES),
                    makeEditContext('test2', ['User'], 'string', ENTITIES_ALT)
                )
            ).toEqual(['Argument 1 type is not compatible: Property not found: id']);
        });

        test('arguments with same entity name and structure does match', () => {
            const aMethod = makeEditContext('test1', ['User'], 'string', ENTITIES);
            const bMethod = makeEditContext('test2', ['User'], 'string', ENTITIES);

            expect(getCompatibleRESTMethodsIssues(aMethod, bMethod)).toEqual([]);

            if (aMethod.method.parameters?.[0]) {
                delete aMethod.method.parameters[0].optional;
            }
            if (bMethod.method.parameters?.[0]) {
                bMethod.method.parameters[0].optional = false;
            }

            expect(getCompatibleRESTMethodsIssues(aMethod, bMethod)).toEqual([]);
        });

        test('arguments with same type but not both required does not match', () => {
            const aMethod = makeEditContext('test1', ['User'], 'string', ENTITIES);
            const bMethod = makeEditContext('test2', ['User'], 'string', ENTITIES);
            if (aMethod.method.parameters?.[0]) {
                aMethod.method.parameters[0].optional = true;
            }
            expect(isCompatibleRESTMethods(aMethod, bMethod)).toBe(false);

            expect(getCompatibleRESTMethodsIssues(aMethod, bMethod)).toEqual([
                'Argument 1 is not compatible because one is optional and the other is not',
            ]);
        });

        test('response type with same entity name but different structure does not match', () => {
            expect(
                isCompatibleRESTMethods(
                    makeEditContext('test1', [], 'User', ENTITIES),
                    makeEditContext('test2', [], 'User', ENTITIES_ALT)
                )
            ).toBe(false);

            expect(
                getCompatibleRESTMethodsIssues(
                    makeEditContext('test1', [], 'User', ENTITIES),
                    makeEditContext('test2', [], 'User', ENTITIES_ALT)
                )
            ).toEqual(['Response types are not compatible', 'Property not found: id']);
        });

        test('response type with same entity name and structure does match', () => {
            expect(
                isCompatibleRESTMethods(
                    makeEditContext('test1', [], 'User', ENTITIES),
                    makeEditContext('test2', [], 'User', ENTITIES)
                )
            ).toBe(true);
        });
    });
});
