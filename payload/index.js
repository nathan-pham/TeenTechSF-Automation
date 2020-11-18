const fs = require("fs").promises;

const schools = require("./data.js");

const render = async (location, data) => {
  let message = (await fs.readFile(location)).toString();

  for (const [key, value] of Object.entries(data)) {
    let reg = new RegExp(`{{${key}}}`, "gi");
    message = message.replace(reg, value);
  }

  return message;
};

const generatePayload = async (to, name) => {
  const message = await render(__dirname + "/template.html", {
    name,
  });

  const payload = [
    'Content-Type: text/html; charset="UTF-8"',
    "MIME-VERSION: 1.0",
    "Content-Transfer-Encoding: 7bit",
    `From: phamn23@puhsd.k12.ca.us`,
    `To: ${to}`,
    "Cc: bwhitney925@gmail.com",
    'Subject: FREE! 12/12 TeenTechSF Global Youth Summit: "Tech & Health: Understand More, Fear Less"\n',
    message,
  ].join("\n");

  const encoded = new Buffer(payload)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return encoded;
};

module.exports = {
  generatePayload,
  schools,
};
