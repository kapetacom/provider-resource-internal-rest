import {describe, expect, test} from "@jest/globals";
import {convertToEditMethod, convertToRestMethod, isCompatibleRESTMethods, RESTMethodEdit} from "../src/web/types";
import {HTTPMethod, isStringableType, RESTMethod, SchemaEntryType} from "@blockware/ui-web-types";
import {ENTITIES, ENTITIES_ALT, makeEditMethod, makeMethod} from "./helpers";


describe('Types', () => {

    test('can convert to edit method', () => {

        expect(convertToEditMethod('test1',makeMethod(['string',{$ref:'User'}], 'string'))).toEqual({
            id: 'test1',
            description: '',
            method: HTTPMethod.POST,
            arguments: [
                {
                    id: 'arg_0',
                    type: 'string',
                    transport: 'QUERY'
                },
                {
                    id: 'arg_1',
                    type: {$ref:'User'},
                    transport: 'BODY'
                }
            ],
            path: '/',
            responseType: 'string'
        })
    })

    test('can convert to rest method from edit method', () => {
        expect(convertToRestMethod({
            id: 'test1',
            description: '',
            method: HTTPMethod.POST,
            arguments: [
                {
                    id: 'arg_0',
                    type: 'string',
                    transport: 'QUERY'
                },
                {
                    id: 'arg_1',
                    type: {$ref:'User'},
                    transport: 'BODY'
                }
            ],
            path: '/',
            responseType: 'string'
        })).toEqual(makeMethod(['string',{$ref:'User'}], 'string'))
    })

    describe('compatibility', () => {

        test('simple methods are equal', () => {

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1'),
                makeEditMethod('test2'),
                [],[]
            )).toBe(true);

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',[],'void'),
                makeEditMethod('test2'),
                [],[]
            )).toBe(true);

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',['string','float']),
                makeEditMethod('test2',['float','string'],'void'),
                [],[]
            )).toBe(true);
        })

        test('simple arguments must match', () => {

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1', ['string']),
                makeEditMethod('test2'),
                [],[]
            )).toBe(false);

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',['string']),
                makeEditMethod('test2',['string']),
                [],[]
            )).toBe(true);

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',['string']),
                makeEditMethod('test2',['boolean']),
                [],[]
            )).toBe(false);
        })

        test('methods with response type void requires match', () => {

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',[],'void'),
                makeEditMethod('test2', [], 'string'),
                [],[]
            )).toBe(false);

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',[], 'string'),
                makeEditMethod('test2', []),
                [],[]
            )).toBe(false);


            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',[], 'string'),
                makeEditMethod('test2', [],'float'),
                [],[]
            )).toBe(true);

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',[], 'string'),
                makeEditMethod('test2', [],'string'),
                [],[]
            )).toBe(true);
        })

        test('arguments with missing entities does not match', () => {

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',[{$ref: 'NotReal'}],'string'),
                makeEditMethod('test2', [{$ref: 'NotReal'}], 'string'),
                [],[]
            )).toBe(false);
        })

        test('arguments with same entity name but different structure does not match', () => {

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',[{$ref: 'User'}],'string'),
                makeEditMethod('test2', [{$ref: 'User'}], 'string'),
                ENTITIES,
                ENTITIES_ALT
            )).toBe(false);
        })

        test('arguments with same entity name and structure does match', () => {

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',[{$ref: 'User'}],'string'),
                makeEditMethod('test2', [{$ref: 'User'}], 'string'),
                ENTITIES,
                ENTITIES
            )).toBe(true);
        })

        test('response type with same entity name but different structure does not match', () => {

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',[],{$ref: 'User'}),
                makeEditMethod('test2', [], {$ref: 'User'}),
                ENTITIES,
                ENTITIES_ALT
            )).toBe(false);
        })

        test('response type with same entity name and structure does match', () => {

            expect(isCompatibleRESTMethods(
                makeEditMethod('test1',[],{$ref: 'User'}),
                makeEditMethod('test2', [], {$ref: 'User'}),
                ENTITIES_ALT,
                ENTITIES_ALT
            )).toBe(true);
        })


    });
})