var debug = require('debug')
var fs = require('fs')
var CSON = require('cson')
var muhammara = require('muhammara')
var jade = require('pug')
var marked = require('marked')
var moment = require('moment')
var nightmare = require('nightmare')
var path = require('path')
var traverse = require('traverse')
var url = require('url')
var resumeSchema = require('resume-schema')

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
      .then(contents => {
        try {
          return JSON.parse(contents)
        } catch (e) {
          const result = CSON.parse(contents)
          if (result instanceof Error) {
            throw new Error([
              'Failed to parse as either JSON or CSON: ',
              '  ' + inputfile,
              'JSON error message: ',
              '  ' + e.message,
              'CSON error message: ',
              '  ' + result.message
            ].join('\n\n'))
          } else {
            return result
          }
        }
      })
      .then(data => {
        return new Promise((resolve, reject) => {
          resumeSchema.validate(data, (err, report) => {
            if (err) return reject(err, report)

            resolve(data)
          })
        })
      })
      .then(data => {
        debug('cobbler:load')('Data: %j', data)
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
  //  Returns a Promise to be resolved once `data` has been pre-processed:
  //
  //  - All `summary` fields will be rendered as Markdown.
  //  - All `website` fields will be converted to URL objects. For
  //    more information, see: https://nodejs.org/api/url.html#url_url_strings_and_url_objects
  //
  preprocess(data) {
    var post = traverse(data).map(function () {
      switch (this.key) {
        case 'summary':
          this.update(marked(this.node))
          break
        case 'website':
          this.update(url.parse(this.node))
          break
      }
    })

    debug('cobbler:preprocess')('Processed: %j', post)

    return Promise.resolve(post)
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
        filename: 'template.pug',
        basedir: path.resolve(__dirname, '../assets'),
      })(Object.assign(data, {
        moment: moment,
      })))
      .then(output => new Promise((resolve, reject) => {
        debug('cobbler:render')('Render output: %s', output)

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
      .pdf(outputfile, {
        pageSize: 'Letter',
      })
      .end()
      // Required to _actually_ start Nightmare.
      .then(_ => {
        // Since `@page { bleed }` and `position: running(..)` are not
        // supported by Electron/Blink, we need to manually annotate the PDF
        // result to add additional branding.
        // TODO(schoon) - Remove in favor of a CSS-based solution once support
        // exists.
        var writer = muhammara.createWriterToModify(outputfile, {
          modifiedFilePath: outputfile,
        })
        var reader = writer.getModifiedFileParser()
        var pages = reader.getPagesCount()
        var mediaBox = reader.parsePage(0).getMediaBox()
        var width = mediaBox[2]
        var pixelsPerPica = mediaBox[3] / 11 / 6
        var modifier

        for (;pages--;) {
          modifier = new muhammara.PDFPageModifier(writer, pages)
          modifier.startContext().getContext().drawRectangle(
            0, 0, width, 1.5 * pixelsPerPica,
            {
              type: 'fill',
              color: 0x6EFF00,
            }
          )
          modifier.endContext().writePage()
        }

        writer.end()
      })
  },
}
