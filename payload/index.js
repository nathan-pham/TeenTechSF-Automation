const showdown = require("showdown")
const fs = require("fs").promises
const path = require("path")

const converter = new showdown.Converter()
const session = "spring-workshops"
const files = {
    data: require(`./${session}/test.json`),
    template: `${__dirname}/${session}/template.md`
}

const extract = (template) => {
    let matches = template.match(/---((.|\n)*)---/gi)
    matches = matches ? matches[0] : ""

    const filtered = matches
        ? matches.split('\n').filter(v => !v.includes("---"))
        : []
    const metadata = {}

    for(const line of filtered) {
        const [key, value] = line.split(':').map(v => v.trim())
        metadata[key] = value   
    }

    return {
        metadata,
        matches
    }
}

const render = async (template, data) => {
    let markdown = (await fs.readFile(template)).toString()
    let { metadata, matches } = extract(markdown)
    let html = converter.makeHtml(markdown.replace(matches, ""))

    for(const [key, value] of Object.entries(data)) {
        html = html.replace(
            new RegExp(`{{\s*${key}\s*}}`, "gi"),
            value
        )
    }

    return {
        html,
        metadata
    }
}

const create = async (to, data) => {
    const { html, metadata } = await render(files.template, data)

    const payload = [
        'Content-Type: text/html; charset="UTF-8"',
        "MIME-VERSION: 1.0",
        "Content-Transfer-Encoding: 7bit",
        `From: phamn23@puhsd.k12.ca.us`,
        `To: ${to}`,
        `Cc: ${metadata.cc}`,
        `Subject: ${metadata.subject}\n`,
        html
    ].join('\n')

    return Buffer.from(payload)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
}

module.exports = {
    files,
    render,
    create,
    extract
}