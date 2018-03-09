var Ajv = require('ajv')

// See https://github.com/epoberezkin/ajv#using-version-6 for an explanation
// of these settings, which are required because JSONResume uses draft-04.
var ajv = new Ajv({
  allErrors: true,
  schemaId: 'id'
})
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

function validateAgainstSchema(schema, data) {
  return Promise.resolve(ajv.validate(schema, data))
    .then(function (valid) {
      if (!valid) {
        var error = new Error('Validation failed')
        error.errors = ajv.errors
        throw error
      }

      return data
    })
}

module.exports = validateAgainstSchema
