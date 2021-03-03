/*
index target: HS, IS, MS, school
email: includes @
*/
const fs = require("fs")
const path = require("path")

const resolve = (file) => path.join(__dirname, file)
const input = resolve("./spring-workshops/raw.txt")
const output = resolve("./spring-workshops/data.json")

const json = {}

const lines = fs.readFileSync(input).toString().split("\n")

const capitalize = (word) => (
    word
        ? word.split(' ').map(v => {
            let letters = v.split('')
            letters[0] = letters[0].toUpperCase()
            return letters.join('')
        }).join(' ')
        : false
)

const parse = (line) => line.map(v => v.trim()).filter(v => v.length)

for(const line of lines) {
    if(line.trim().startsWith("#") || !line.length) {
        continue
    }
    
    if(line.includes('|')) {
        const [school, email] = parse(line.split('|'))
        json[school] = email
    }
    else {
        const words = parse(line.split(' ')).join(' ')
        const school = (words.match(/.+(hs|is|ms|school|academy|district)\s+?/gim) || [""])[0].split("\t")[0].trim()
        const email = (words.match(/\S+@\S*/gim) || [""])[0].trim()
            
        if(school && email) {
            const upper = capitalize(school)
            if(upper) {
                json[school] = email
            }
        }
    }
}

fs.writeFileSync(output, JSON.stringify(json, null, 4))