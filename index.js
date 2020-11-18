const { google } = require("googleapis");

const readline = require("readline");
const fs = require("fs").promises;

const config = require("./config");
const payload = require("./payload/index");

const init = async () => {
  let credentials;
  try {
    credentials = JSON.parse(await fs.readFile("credentials.json"));
  } catch (e) {
    return console.log("Failed to load credentials.");
  }

  const AuthClient = await authorize(credentials);

  await blastEmails(AuthClient);
};

const blastEmails = async (auth) => {
  const gmail = google.gmail({ version: "v1", auth });

  for (const [key, value] of Object.entries(payload.schools)) {
    const raw = await payload.generatePayload(value.join(", "), key);

    gmail.users.messages.send(
      {
        auth,
        userId: "me",
        resource: {
          raw,
        },
      },
      function (err, response) {
        if (err) {
          return console.log("Error sending message.");
        }
        console.log("Success!");
      }
    );
  }
};

const authorize = async (credentials) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const AuthClient = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  try {
    AuthClient.setCredentials(JSON.parse(await fs.readFile(config.tokenPath)));
  } catch (e) {
    AuthClient.setCredentials(await newToken(AuthClient));
  }
  return AuthClient;
};

const newToken = (AuthClient) => {
  const authURL = AuthClient.generateAuthUrl({
    access_type: "offline",
    scope: config.scopes,
  });
  console.log(`Visit ${authURL} to authorize this app.`);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("Enter your code: ", (code) => {
      rl.close();
      AuthClient.getToken(code, async (err, token) => {
        if (err) {
          reject("Could not retrieve access token.");
        }
        await fs.writeFile(config.tokenPath, JSON.stringify(token));
        console.log(`Token saved to ${config.tokenPath}`);
        resolve(token);
      });
    });
  });
};

init();
