# waterline-to-boom
#### Transform waterline errors to Boom errors for general hapiness.

Turns standard `WLError`, `WLUsageError`, and `WLValidationError` Waterline errors into proper Boom errors for use in hapi error handlers.  Best used with [dogwater](https://github.com/devinivy/dogwater).
 - `WLError` gets wrapped by Boom (status code set in error's `code` property, error message set in error's `reason` property).
 - `WLUsageError` becomes a `Boom.badImplementation` (500).
 - `WLValidationError` includes validation errors in a `Boom.badData` (422).
 - All others become a `Boom.badImplementation` (500).

Module arguments
 - The Waterline error
 - (OPTIONAL) The resource name (often a Waterline collection identity).  This is used when building `WLValidationError` into a Boom error.
 - (OPTIONAL) An array of allowed attributes.  Only validation errors on these attributes will be mentioned in the resulting Boom errors resulting from `WLValidationError`s.  If not provided, all attributes are fair-game for mentioning.