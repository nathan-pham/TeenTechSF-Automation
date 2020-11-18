const { google } = require("googleapis");

const readline = require("readline");
const fs = require("fs").promises;

const config = require("./config");

const init = async () => {
  let credentials;
  try {
    credentials = JSON.parse(await fs.readFile("credentials.json"));
  } catch (e) {
    return console.log("Failed to load credentials.");
  }

  const AuthClient = await authorize(credentials);
  listLabels(AuthClient);
};

const listLabels = (auth) => {
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.labels.list(
    {
      userId: "me",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const labels = res.data.labels;
      if (labels.length) {
        console.log("Labels:");
        labels.forEach((label) => {
          console.log(`- ${label.name}`);
        });
      } else {
        console.log("No labels found.");
      }
    }
  );
};

const authorize = async (credentials) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const AuthClient = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  try {
    const token = JSON.parse(await fs.readFile(config.tokenPath));
    AuthClient.setCredentials(token);
  } catch (e) {
    AuthClient = await newToken(AuthClient);
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
        AuthClient.setCredentials(token);
        resolve(AuthClient);
      });
    });
  });
};

init();
