const { app, BrowserWindow, ipcMain } = require('electron');
const crypto = require('crypto');
const { multiNodeReqs } = require('./serverReqFuncs')

const args = process.argv.slice(2);

let isBot = false;
let portArr = [];

// Check for the flag argument (true/false)
if (args.length < 2) {
  throw new Error("Usage: npm start <true/false> <port1,port2,...>");
}

const arg = args[0]?.toLowerCase();

if (arg === "true") {
  isBot = true;
} else if (arg === "false") {
  isBot = false;
} else {
  throw new Error(
    `Incorrect argument. Expected 'true' or 'false', but got ${arg}`
  );
}

portArr = args[1]
  .split(",")
  .map(Number)
  .filter((port) => !isNaN(port));

if (portArr.length === 0) {
  throw new Error("No valid ports provided.");
}

function makeElectronApp(portArr) {
  let win;

  function createWindow() {
    win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    win.loadFile("index.html");

    win.webContents.once("did-finish-load", () => {
      win.webContents.send("set-port-array", portArr);
    });
  }

  app.whenReady().then(() => {
    createWindow();

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

async function handleBotConnection() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 512,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  const timestamp = Date.now().toString();
  const signer = crypto.createSign("SHA256");
  signer.update(timestamp);

  const encodedSignature = signer.sign(privateKey, "base64");
  const encodedPublicKey = Buffer.from(publicKey).toString("base64");

  // const dbCommand = "add 'user1' '{\"name\": \"Alice\", \"age\": 25}'"
  const dbCommand = "read *";

  const reqObj = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-public-key": encodedPublicKey,
      "x-signature": encodedSignature,
      "x-timestamp": timestamp,
    },
    body: JSON.stringify({
      inputData: dbCommand,
    }),
  };

  const responseText = await multiNodeReqs(portArr, reqObj);

  console.log(responseText);
}

if (!isBot) {
  makeElectronApp(portArr);
} else {
  handleBotConnection();
}
