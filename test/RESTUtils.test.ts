/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from '@jest/globals';
import {
    getCounterValue,
    hasMethod,
    renameEntityReferences,
    resolveEntities,
    validate,
    validateApiName,
} from '../src/web/RESTUtils';
import { ENTITIES, makeAPI, makeAPIContext, makeMethod } from './helpers';

describe('RESTUtils', () => {
    test('can validate api names', () => {
        expect(() => validateApiName('', 'test')).not.toThrowError();
        expect(() => validateApiName('', 'test-')).toThrowError();
        expect(() => validateApiName('', '-test')).toThrowError();
        expect(() => validateApiName('', 'backend-api')).toThrowError();
        expect(() => validateApiName('', 'backend.api')).toThrowError();
    });
    test('can get counter value (number of methods in API)', () => {
        expect(getCounterValue(makeAPI([]))).toBe(0);

        expect(getCounterValue(makeAPI([makeMethod('test1'), makeMethod('test2'), makeMethod('test3')]))).toBe(3);
    });

    test('can determine if api has method by name', () => {
        expect(hasMethod(makeAPI([]), 'test')).toBe(false);

        expect(hasMethod(makeAPI([makeMethod('test1'), makeMethod('test2'), makeMethod('test3')]), 'test')).toBe(false);

        expect(hasMethod(makeAPI([makeMethod('test1'), makeMethod('test2'), makeMethod('test3')]), 'test1')).toBe(true);
    });

    test('can resolve all entities from methods', () => {
        expect(
            resolveEntities(makeAPIContext([makeMethod('test1'), makeMethod('test2'), makeMethod('test3')]))
        ).toEqual([]);

        expect(
            resolveEntities(
                makeAPIContext(
                    [
                        makeMethod('test1', ['User', 'string']),
                        makeMethod('test2', [], 'Person'),
                        makeMethod('test3', ['string', 'Staff']),
                    ],
                    ENTITIES
                )
            )
        ).toEqual(['User', 'Person', 'Staff']);

        expect(resolveEntities(makeAPIContext([makeMethod('test1', [], 'Person')], ENTITIES))).toEqual(['Person']);
    });

    test('can rename reference', () => {
        const api = makeAPI([
            makeMethod('test1', ['User', 'string']),
            makeMethod('test2', [], 'Person[]'),
            makeMethod('test3', ['string', 'Staff']),
        ]);

        expect(api.spec.methods?.test1?.arguments?.arg_0).toEqual({
            argument: 'arg_0',
            ref: 'User',
            transport: 'BODY',
            optional: false,
        });

        renameEntityReferences(api, 'User', 'UserInformation');

        expect(api.spec.methods?.test1?.arguments?.arg_0).toEqual({
            argument: 'arg_0',
            ref: 'UserInformation',
            transport: 'BODY',
            optional: false,
        });

        expect(api.spec.methods?.test2?.responseType).toEqual({
            ref: 'Person[]',
        });
        renameEntityReferences(api, 'Person', 'PersonInfo');
        expect(api.spec.methods?.test2?.responseType).toEqual({
            ref: 'PersonInfo[]',
        });
    });

    describe('validation', () => {
        test('fails validation if entity is not found', () => {
            expect(validate(makeAPIContext([makeMethod('test', ['Company'], 'Department')], ENTITIES))).toEqual([
                'Multiple entities are not defined in this block: Department, Company. Create these entities to solve this issue',
            ]);
        });

        test('accepts empty path', () => {
            const method = makeMethod('test');
            if (method.annotations?.[0].arguments) {
                method.annotations[0].arguments = [''];
            }

            const context = makeAPIContext([method], ENTITIES);
            expect(validate(context)).toEqual([]);
        });

        test('fails if method is empty', () => {
            const method = makeMethod('test');
            method.annotations = [];

            expect(validate(makeAPIContext([method], ENTITIES))).toEqual([
                'test is missing a HTTP method. Add a HTTP method to solve this issue',
            ]);
        });

        test('fails if argument type is empty', () => {
            const method = makeMethod('test', ['string', 'float']);
            if (method.parameters?.[0]) {
                // @ts-ignore
                method.parameters[0].type = undefined;
            }

            expect(validate(makeAPIContext([method], ENTITIES))).toEqual([
                'test is missing a type for the parameter arg_0. Add a type to solve this issue',
            ]);
        });

        test('fails if argument transport is empty', () => {
            const method = makeMethod('test', ['string', 'float']);
            if (method.parameters?.[0]) {
                method.parameters[0].annotations = [];
            }
            expect(validate(makeAPIContext([method], ENTITIES))).toEqual([
                'test is missing transport for the parameter arg_0. Add a transport to solve this issue',
            ]);
        });

        test('passes if valid method is supplied', () => {
            const method: any = makeMethod('test', ['string', 'float'], 'void');

            expect(validate(makeAPIContext([method], ENTITIES))).toEqual([]);
        });

        test('passes if method has no arguments', () => {
            const method = makeMethod('test', [], 'void');
            delete method.parameters;

            expect(validate(makeAPIContext([method], ENTITIES))).toEqual([]);
        });
    });
});
