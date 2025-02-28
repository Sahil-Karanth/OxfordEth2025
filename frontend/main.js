const { app, BrowserWindow } = require('electron');
const crypto = require('crypto');
const { multiNodeReqs } = require('./serverReqFuncs')

const args = process.argv.slice(2);

let isBot = false;
let portFailChancePairs = [];

if (args.length < 2) {
  throw new Error("Usage: npm start <isBot> <[(port1,failChance1),(port2,failChance2),...]>");
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

const pairsInput = args[1];

if (!/^\[(\(\d+,\d+\))(,\(\d+,\d+\))*\]$/.test(pairsInput)) {
  throw new Error(
    `Invalid input format. Expected [(port1,failChance1),(port2,failChance2),...], but got ${pairsInput}`
  );
}

portFailChancePairs = pairsInput
  .slice(1, -1)
  .split(/\),\(/)
  .map((pair) => {
    const [port, failChance] = pair.replace(/[()]/g, "").split(",");
    const portNum = parseInt(port, 10);
    const failChanceNum = parseInt(failChance, 10);

    if (isNaN(portNum) || portNum < 0 || portNum > 65535) {
      throw new Error(`Invalid port number: ${port}`);
    }
    if (isNaN(failChanceNum) || failChanceNum < 0 || failChanceNum > 100) {
      throw new Error(`Invalid failure chance: ${failChance}`);
    }

    return { port: portNum, failChance: failChanceNum };
  });

if (portFailChancePairs.length === 0) {
  throw new Error("No valid port-failure chance pairs provided.");
}

portFailChancePairs.forEach((portObj) => {
  console.log(`port ${portObj.port} (${portObj.failChance}% programmed failure chance)`)
});

function genAuthPair() {
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

  return {encodedPublicKey, encodedSignature, timestamp}
}

function makeElectronApp(portsAndFailures) {
  let win;

  function createWindow() {

    const { encodedPublicKey, encodedSignature, timestamp } = genAuthPair();
  
    console.log(`\nEXAMPLE ENCODED PUBLIC KEY\n${encodedPublicKey}\n\nEXAMPLE ENCODED SIGNATURE\n${encodedSignature}`)

    win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    win.loadFile("home.html");

    win.webContents.once("did-finish-load", () => {
      win.webContents.send("set-ports", portsAndFailures);
    });

    win.webContents.once("did-finish-load", () => {
      win.webContents.send("time-stamp", timestamp);
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

  const { encodedPublicKey, encodedSignature, timestamp } = genAuthPair();


  console.log(encodedPublicKey)
  console.log(encodedSignature)

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

  const responseText = await multiNodeReqs(portFailChancePairs, reqObj);

  console.log(responseText);
}

if (!isBot) {
  makeElectronApp(portFailChancePairs);
} else {
  handleBotConnection();
}
