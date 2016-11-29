var debug = require('debug')
var fs = require('fs')
var jade = require('pug')
var nightmare = require('nightmare')
var path = require('path')
var validator = require('z-schema')
var RESUME_SCHEMA = require('resume-schema/schema.json')

module.exports = {
  //
  //  Returns a Promise to be resolved with the metadata at `inputfile`,
  //  parsed as JSON.
  //
  //  This path should be absolute.
  //
  load(inputfile) {
    return new Promise((resolve, reject) => {
      fs.readFile(inputfile, 'utf8', (err, contents) => {
        if (err) return reject(err)

        resolve(contents)
      })
    })
      .then(json => JSON.parse(json))
      .then(data => {
        return validator.validate(data, RESUME_SCHEMA)
          .then(_ => data)
      })
      .then(data => {
        debug('dossier:load')('Data: %j', data)
        return data
      })
      .catch(err => {
        if (err.errors) {
          throw new Error([err.message].concat(
            err.errors.map(validationError => {
              return validationError.path + ': ' + validationError.message
            })
          ).join('\n'))
        }

        if (err) throw err
      })
  },

  //
  //  Returns a Promise to be resolved once the Handlebars template at
  //  `inputfile` is completely rendered with `data` and written to
  //  `outputfile`.
  //
  //  Both paths should be absolute.
  //
  render(inputfile, data, outputfile) {
    return new Promise((resolve, reject) => {
      fs.readFile(inputfile, 'utf8', (err, contents) => {
        if (err) return reject(err)

        resolve(contents)
      })
    })
      .then(template => jade.compile(template, {
        filename: 'template.html',
        basedir: path.resolve(__dirname, '../assets'),
      })(data))
      .then(output => new Promise((resolve, reject) => {
        debug('dossier:render')('Render output: %s', output)

        fs.writeFile(outputfile, output, 'utf8', err => {
          if (err) return reject(err)

          resolve()
        })
      }))
  },

  //
  //  Returns a Promise to be resolved once a PDF from the `inputfile` HTML
  //  document is written to `outputfile`.
  //
  //  Both paths should be absolute.
  //
  pdf(inputfile, outputfile) {
    if (!path.isAbsolute(inputfile)) {
      return Process.reject(new Error('Input file must be an absolute path.'))
    }

    if (!path.isAbsolute(outputfile)) {
      return Process.reject(new Error('Output file must be an absolute path.'))
    }

    return nightmare({ show: false })
      .goto('file://' + inputfile)
      .pdf(outputfile)
      .end()
      // Required to _actually_ start Nightmare.
      .then(a => a)
  },
}
