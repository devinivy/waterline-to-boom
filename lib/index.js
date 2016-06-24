'use strict';

const Boom = require('boom');

// Helper for Waterline errors!
module.exports = function (err, resource, allowedAttributes) {

    if (err.isBoom) {
        return err;
    }

    // Accepts allowedAttributes as second parameter
    if (Array.isArray(resource)) {
        allowedAttributes = resource;
        resource = undefined;
    }

    // This is what we're building
    let boomError;

    if (err instanceof Error) {

        const errName = err.constructor.name;

        // See https://github.com/balderdashy/waterline/tree/master/lib/waterline/error
        switch (errName) {

            case 'WLError':

                boomError = Boom.wrap(err, err.status, err.reason);
                break;

            case 'WLValidationError':

                let attributeWLErrors;
                const boomValidationErrors = [];

                if (err.invalidAttributes) {

                    // Only deal with attributes we're allowed to talk about... shh!!
                    if (allowedAttributes) {

                        attributeWLErrors = allowedAttributes.reduce((list, attribute) => {

                            list[attribute] = err.invalidAttributes[attribute];
                            return list;
                        }, {});

                    }
                    else {
                        attributeWLErrors = err.invalidAttributes;
                    }

                    let error;
                    let attr;
                    let attributeWLError;
                    let attributeWLErrorArray;

                    // Generate github-style validation (422) error from WLError
                    const attrs = Object.keys(attributeWLErrors);
                    for (let i = 0; i < attrs.length; ++i) {

                        attr = attrs[i];
                        attributeWLErrorArray = attributeWLErrors[attr];

                        for (let j = 0; j < attributeWLErrorArray.length; ++j) {

                            attributeWLError = attributeWLErrorArray[j];

                            error = {};

                            if (resource) {
                                error.resource = resource;
                            }

                            error.field = attr;

                            if (attributeWLError.rule) {
                                error.code = attributeWLError.rule;
                            }

                            boomValidationErrors.push(error);
                        }

                    }

                }

                boomError = Boom.badData('Validation Failed');

                if (boomValidationErrors.length) {
                    boomError.output.payload.validation = boomValidationErrors;
                }

                break;

            case 'WLUsageError':
            default:

                // Like an internal error, but marked as being the developer's fault for logging
                boomError = Boom.badImplementation(err.message, err);
                break;
        }

    }
    else {

        // We don't know exactly what's wrong... this isn't a proper Error
        // Like an internal error, but marked as being the developer's fault for logging
        boomError = Boom.badImplementation('Could not convert non-Error to Boom.', err);
    }

    return boomError;
};
