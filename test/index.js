'use strict';

// Load modules
const Lab = require('lab');
const Code = require('code');
const Boom = require('boom');

// The plugin
const WL2B = require('..');

// Test shortcuts
const lab = exports.lab = Lab.script();
const expect = Code.expect;
const experiment = lab.experiment;
const test = lab.test;

// Waterline error types
const WLError = require('waterline/lib/waterline/error/WLError');
const WLValidationError = require('waterline/lib/waterline/error/WLValidationError');
const WLUsageError = require('waterline/lib/waterline/error/WLUsageError');

experiment('waterline-to-boom', () => {

    test('lets Boom errors pass straight through.', (done) => {

        const err = Boom.wrap(new Error());

        expect(WL2B(err)).to.shallow.equal(err);
        done();
    });

    test('Boom-wraps WLErrors, maintaining status code and reason.', (done) => {

        const err = new WLError();

        const processed = WL2B(err);

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(err.status);
        expect(processed.message).to.match(new RegExp('^' + err.reason));

        done();
    });

    test('returns Boom.badImplementation on WLUsageError.', (done) => {

        const err = new WLUsageError();

        const processed = WL2B(err);

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(500);
        expect(processed.isDeveloperError).to.equal(true);

        done();
    });

    test('returns Boom.badImplementation on non-WL type errors.', (done) => {

        const err = new Error();

        const processed = WL2B(err);

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(500);
        expect(processed.isDeveloperError).to.equal(true);

        done();
    });

    test('returns Boom.badImplementation on non-error objects.', (done) => {

        const err = { error: true };

        const processed = WL2B(err);

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(500);
        expect(processed.isDeveloperError).to.equal(true);

        done();
    });

    test('returns Boom.badData without `validation` on WLValidationError with empty `invalidAttributes.', (done) => {

        const err = new WLValidationError({ invalidAttributes: {} });

        const processed = WL2B(err);

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.not.exist();

        done();
    });

    test('returns Boom.badData without `validation` on WLValidationError with undefined `invalidAttributes.', (done) => {

        const err = new WLValidationError({ invalidAttributes: {} });
        delete err.invalidAttributes;

        const processed = WL2B(err);

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.not.exist();

        done();
    });

    test('returns Boom.badData with `validation` on WLValidationError with `invalidAttributes` and with `rule`.', (done) => {

        const err = new WLValidationError({
            invalidAttributes: {
                thisAttr: [
                    {
                        rule: 'isUnique'
                    }
                ]
            }
        });

        const processed = WL2B(err);

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.be.an.array();
        expect(processed.output.payload.validation).to.have.length(1);

        expect(processed.output.payload.validation[0].resource).to.not.exist();
        expect(processed.output.payload.validation[0].field).to.equal('thisAttr');
        expect(processed.output.payload.validation[0].code).to.equal('isUnique');

        done();
    });

    test('returns Boom.badData with `validation` on WLValidationError with `invalidAttributes` and without `rule`.', (done) => {

        const err = new WLValidationError({
            invalidAttributes: {
                'thisAttr': [
                    {}
                ]
            }
        });

        const processed = WL2B(err);

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.be.an.array();
        expect(processed.output.payload.validation).to.have.length(1);

        expect(processed.output.payload.validation[0].resource).to.not.exist();
        expect(processed.output.payload.validation[0].field).to.equal('thisAttr');
        expect(processed.output.payload.validation[0].code).to.not.exist();

        done();
    });

    test('returns Boom.badData including resource name (when provided) on WLValidationError.', (done) => {

        const err = new WLValidationError({
            invalidAttributes: {
                'thisAttr': [
                    {
                        rule: 'isUnique'
                    }
                ]
            }
        });

        const processed = WL2B(err, 'resourceName');

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.be.an.array();
        expect(processed.output.payload.validation).to.have.length(1);

        expect(processed.output.payload.validation[0].resource).to.equal('resourceName');

        done();
    });

    test('returns Boom.badData on WLValidationError, including only allowedAttributes (using 3 args).', (done) => {

        const err = new WLValidationError({
            invalidAttributes: {
                'thisAttr': [
                    {
                        rule: 'isUnique'
                    }
                ],
                'thatAttr': [
                    {
                        rule: 'isUnique'
                    }
                ]
            }
        });

        const processed = WL2B(err, 'resourceName', ['thatAttr']);

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.be.an.array();
        expect(processed.output.payload.validation).to.have.length(1);

        expect(processed.output.payload.validation[0].resource).to.equal('resourceName');
        expect(processed.output.payload.validation[0].field).to.equal('thatAttr');

        done();
    });

    test('returns Boom.badData on WLValidationError, including only allowedAttributes (using 2 args).', (done) => {

        const err = new WLValidationError({
            invalidAttributes: {
                thisAttr: [
                    {
                        rule: 'isUnique'
                    }
                ],
                thatAttr: [
                    {
                        rule: 'isUnique'
                    }
                ]
            }
        });

        const processed = WL2B(err, ['thatAttr']);

        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.be.an.array();
        expect(processed.output.payload.validation).to.have.length(1);

        expect(processed.output.payload.validation[0].field).to.equal('thatAttr');
        expect(processed.output.payload.validation[0].resource).to.not.exist();

        done();
    });

});
