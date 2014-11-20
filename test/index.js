// Load modules
var Lab = require('lab');
var Boom = require('boom');

// The plugin
var WL2B = require('..');

// Waterline error types
var WLError = require('waterline/lib/waterline/error/WLError');
var WLValidationError = require('waterline/lib/waterline/error/WLValidationError');
var WLUsageError = require('waterline/lib/waterline/error/WLUsageError');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var experiment = lab.experiment;
var test = lab.test;

experiment('waterline-to-boom', function () {
    
    test('lets Boom errors pass straight through.', function(done) {
        
        var err = Boom.wrap(new Error());
        
        expect(WL2B(err)).to.equal(err);
        done();
    });
    
    test('Boom-wraps WLErrors, maintaining status code and reason.', function(done) {
        
        var err = new WLError();
        
        var processed = WL2B(err);
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(err.status);
        expect(processed.message).to.equal(err.reason);
        
        done();
    });
    
    test('returns Boom.badImplementation on WLUsageError.', function(done) {
        
        var err = new WLUsageError();
        
        var processed = WL2B(err);
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(500);
        expect(processed.isDeveloperError).to.equal(true);
        
        done();
    });
    
    test('returns Boom.badImplementation on non-WL type errors.', function(done) {
        
        var err = new Error();
        
        var processed = WL2B(err);
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(500);
        expect(processed.isDeveloperError).to.equal(true);
        
        done();
    });
    
    test('returns Boom.badImplementation on non-error objects.', function(done) {
        
        var err = {error: true};
        
        var processed = WL2B(err);
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(500);
        expect(processed.isDeveloperError).to.equal(true);
        
        done();
    });
    
    test('returns Boom.badData without `validation` on WLValidationError with empty `invalidAttributes.', function(done) {
        
        var err = new WLValidationError({invalidAttributes: {}});
        
        var processed = WL2B(err);
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.not.exist;
        
        done();
    });
    
    test('returns Boom.badData without `validation` on WLValidationError with undefined `invalidAttributes.', function(done) {
        
        var err = new WLValidationError({invalidAttributes: {}});
        delete err.invalidAttributes;
        
        var processed = WL2B(err);
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.not.exist;
        
        done();
    });
    
    test('returns Boom.badData with `validation` on WLValidationError with `invalidAttributes` and with `rule`.', function(done) {
        
        var err = new WLValidationError({invalidAttributes: {
            'thisAttr': [
                {
                    rule: 'isUnique'
                }
            ]
        }});
        
        var processed = WL2B(err);
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.be.an.array;
        expect(processed.output.payload.validation).to.have.length(1);
        
        expect(processed.output.payload.validation[0].resource).to.not.exist;
        expect(processed.output.payload.validation[0].field).to.equal('thisAttr');
        expect(processed.output.payload.validation[0].code).to.equal('isUnique');
        
        done();
    });
    
    test('returns Boom.badData with `validation` on WLValidationError with `invalidAttributes` and without `rule`.', function(done) {
        
        var err = new WLValidationError({invalidAttributes: {
            'thisAttr': [
                {}
            ]
        }});
        
        var processed = WL2B(err);
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.be.an.array;
        expect(processed.output.payload.validation).to.have.length(1);
        
        expect(processed.output.payload.validation[0].resource).to.not.exist;
        expect(processed.output.payload.validation[0].field).to.equal('thisAttr');
        expect(processed.output.payload.validation[0].code).to.not.exist;
        
        done();
    });
    
    test('returns Boom.badData including resource name (when provided) on WLValidationError.', function(done) {
        
        var err = new WLValidationError({invalidAttributes: {
            'thisAttr': [
                {
                    rule: 'isUnique'
                }
            ]
        }});
        
        var processed = WL2B(err, 'resourceName');
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.be.an.array;
        expect(processed.output.payload.validation).to.have.length(1);
        
        expect(processed.output.payload.validation[0].resource).to.equal('resourceName');
        
        done();
    });
    
    test('returns Boom.badData on WLValidationError, including only allowedAttributes (using 3 args).', function(done) {
        
        var err = new WLValidationError({invalidAttributes:
            {
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
        
        var processed = WL2B(err, 'resourceName', ['thatAttr']);
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.be.an.array;
        expect(processed.output.payload.validation).to.have.length(1);
        
        expect(processed.output.payload.validation[0].resource).to.equal('resourceName');
        expect(processed.output.payload.validation[0].field).to.equal('thatAttr');
        
        done();
    });
    
    test('returns Boom.badData on WLValidationError, including only allowedAttributes (using 2 args).', function(done) {
        
        var err = new WLValidationError({invalidAttributes:
            {
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
        
        var processed = WL2B(err, ['thatAttr']);
        
        expect(processed.isBoom).to.equal(true);
        expect(processed.output.statusCode).to.equal(422);
        expect(processed.output.payload.validation).to.be.an.array;
        expect(processed.output.payload.validation).to.have.length(1);
        
        expect(processed.output.payload.validation[0].field).to.equal('thatAttr');
        expect(processed.output.payload.validation[0].resource).to.not.exist;
        
        done();
    });
    
});