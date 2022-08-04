# Cobbler

Generates Test-Double-branded résumés from [JSON-Resume-compatible][json-resume] JSON documents.

## Options

| Option | Description |
|---|---|
| `-i, --input FILE` | Read from this JSON document, specified as a relative path. |
| `-o, --output FILE` | Write to this PDF file, specified as a relative path. |

## Process

1. Reads the input file.
2. Parses the input file as JSON.
3. Validates the parsed data matches the [JSON Resume schema][json-resume-schema].
4. Renders the internal template to HTML with the validated data.
5. Writes a print-ready PDF to the output file.

## Key Dependencies

- [JSON Resume][json-resume-npm], used for data validation.
- [Pug.js][pug], used for template rendering.
- [SASS][sass], used for styling.
- [Nightmare][nightmare], used for PDF generation.
- [Muhammara][muhammara], used for PDF annoatation.

## What's with the name?

We love ourselves some spycraft (and/or spy myth) at Test Double, and a "cobbler" is an expert in creating the necessary documentation for an Agent's work.

[json-resume]: https://jsonresume.org/
[json-resume-schema]: https://jsonresume.org/schema/
[json-resume-npm]: https://www.npmjs.com/package/resume-schema
[pug]: https://pugjs.org/api/getting-started.html
[sass]: https://www.npmjs.com/package/node-sass
[nightmare]: http://www.nightmarejs.org/
[muhammara]: https://www.npmjs.com/package/muhammara
