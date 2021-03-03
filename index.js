const { google } = require("googleapis")
const readline = require("readline")
const fs = require("fs").promises
const payload = require("./payload")
const { scope, tokenPath } = require("./config")

const authenticate = async () => {
    let credentials = {}

    try {
        credentials = require("./credentials.json")
    }
    catch(e) {
        console.log("no credentials")
    }

    return authorize(credentials)
}

const authorize = async (credentials) => {
    const {
        client_id,
        client_secret,
        redirect_uris
    } = credentials.installed

    const AuthClient = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    )

    try {
        AuthClient.setCredentials(
            JSON.parse(await fs.readFile(tokenPath))
        )
    }
    catch(e) {
        AuthClient.setCredentials(await newToken(AuthClient))
    }
    
    return AuthClient
}


const newToken = (AuthClient) => {
    const url = AuthClient.generateAuthUrl({
        access_type: "offline",
        scope
    })

    console.log(`visit ${url} to authorize this app`)

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve, reject) => {
        rl.question("code: ", (code) => {
            rl.close()
            AuthClient.getToken(code, async (err, token) => {
                if(err) {
                    reject("invalid access token")
                }
                
                await fs.writeFile(tokenPath, JSON.stringify(token))
                console.log(`token saved to ${tokenPath}`)
                resolve(token)
            })
        })
    })
}

const blastEmails = async () => {
    const AuthClient = await authenticate()

    const gmail = google.gmail({ version: "v1", auth: AuthClient })

    for(const [key, value] of Object.entries(payload.files.data)) {
        const raw = await payload.create(value, {
            name: key
        })

        gmail.users.messages.send({
            auth: AuthClient,
            userId: "me",
            resource: { raw }
        }, (err, res) => {
            console.log(err
                ? `error sending message to ${key}`
                : "success"
            )
        })
    }
}

blastEmails()