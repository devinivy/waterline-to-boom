var Boom = require('boom');
var _    = require('lodash');

// Helper for Waterline errors!
module.exports = function(err, resource, allowedAttributes) {
    
    if (err.isBoom) return err;
    
    // Accepts allowedAttributes as second parameter
    if (_.isArray(resource)) {
        allowedAttributes = resource;
        resource = undefined;
    }
    
    // This is what we're building
    var BoomError;
    
    if (err instanceof Error) {
        
        var errName = err.constructor.name;
        
        // See https://github.com/balderdashy/waterline/tree/master/lib/waterline/error
        switch (errName) {
            
            case 'WLError':
                
                BoomError = Boom.wrap(err, err.status, err.reason);                
                break;
            
            case 'WLValidationError':
                
                var attributeWLErrors;
                var boomValidationErrors = [];
                
                if (err.invalidAttributes) {
                    
                    // Only deal with attributes we're allowed to talk about... shh!!
                    attributeWLErrors = allowedAttributes ?
                                            _.pick(err.invalidAttributes, allowedAttributes) :
                                            _.cloneDeep(err.invalidAttributes);
                    
                    if (!_.isEmpty(attributeWLErrors)) {
                        
                        var error;
                        var attributeWLError;
                        var attributeWLErrorArray;
                        
                        // Generate github-style validation (422) error from WLError
                        for (var attr in attributeWLErrors) {
                            
                            attributeWLErrorArray = attributeWLErrors[attr];
                            
                            for (var i = 0; i < attributeWLErrorArray.length; i++) {
                                
                                attributeWLError = attributeWLErrorArray[i];
                                
                                error = {};
                                
                                if (resource)
                                    error.resource = resource;
                                
                                error.field = attr;
                                
                                if (attributeWLError.rule)
                                    error.code = attributeWLError.rule
                                
                                boomValidationErrors.push(error);
                            }
                            
                        }
                        
                    }
                    
                }
                
                BoomError = Boom.badData("Validation Failed");
                
                if (boomValidationErrors.length) {
                    BoomError.output.payload.validation = boomValidationErrors;
                }
                
                break;
            
            case 'WLUsageError':
            default:
                
                // Like an internal error, but marked as being the developer's fault for logging
                BoomError = Boom.badImplementation();
                break;
        }
        
    } else {
        
        // We don't know exactly what's wrong... this isn't a proper Error
        // Like an internal error, but marked as being the developer's fault for logging
        BoomError = Boom.badImplementation();
    }
    
    return BoomError;
    
}