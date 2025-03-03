import { auth } from './firebaseConfig.js';
import crypto from 'crypto';

var TRUSTED_BOT_PUBLIC_KEYS = new Set([
  `-----BEGIN PUBLIC KEY-----
  MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAL2dCLhxoKzPwhV0rM48KzFWcRMy/3SM
  AFfpKmgusbFHirLrpLcAY0h80K1CqcCrug3AlUgRk5Ln/UgDXNvi99ECAwEAAQ==
  -----END PUBLIC KEY-----`.split(String.raw`\n`).join('\n')
]);


const decodeToken = async (req, res, next) => {
  try {
    // Check for bot authentication
    const encodedPublicKey = req.headers['x-public-key'];
    const encodedSignature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    
    if (encodedPublicKey && encodedSignature && timestamp) {
      const publicKey = Buffer.from(encodedPublicKey, 'base64').toString('utf8');
      const signature = Buffer.from(encodedSignature, 'base64').toString('utf8');

      TRUSTED_BOT_PUBLIC_KEYS.add(publicKey);
      
      // Verify timestamp is within last 5 minutes to prevent replay attacks
      const timestampNum = parseInt(timestamp); 
      if (Date.now() - timestampNum > 5 * 60 * 1000) {
        return res.status(401).json({ message: "Timestamp too old" });
      }

      if (!(TRUSTED_BOT_PUBLIC_KEYS.has(publicKey))) {
        return res.status(401).json({ message: "Unknown bot" });
      }

      // Verify the signature with the public key
      const verifier = crypto.createVerify('SHA256');
      verifier.update(timestamp);
      const isValidSignature = verifier.verify(publicKey, encodedSignature, 'base64');

      if (isValidSignature) {
        req.isBot = true;
        return next();
      }

      return res.status(401).json({ message: "Invalid signature" });
    }

    // Regular Firebase token auth for humans
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    if (decodedToken) {
      req.isBot = false;
      req.user = decodedToken;
      return next();
    }

    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: error });
  }
};

export { decodeToken };
