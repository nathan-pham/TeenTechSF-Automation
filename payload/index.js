const data = require("data.js");
const fs = require("fs").promises;

const render = async (path, data) => {
  const message = (await fs.readFile("./template.html")).toString();
  for (const [key, value] of Object.entries(data)) {
    let reg = new RegExp(`{{${key}}}`, "gi");
    message = message.replace(reg, value);
  }

  return message;
};

const generatePayload = async (to, name) => {
  const message = await render("./template.html", {
    name,
  });
  const payload = [
    'Content-Type: text/html; charset="UTF-8"',
    "MIME-VERSION: 1.0",
    "Content-Transfer-Encoding: 7bit",
    `to: ${to}`,
    `from: phamn23@puhsd.k12.ca.us`,
    "subject: FREE! 12/12 TeenTechSF Global Youth Summit: “Tech & Health: Understand More, Fear Less”\n",
    message,
  ].join("\n");

  const encoded = Buffer.from(payload, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return encoded;
};

module.exports = {
  generatePayload,
};
