import crypto from "crypto";

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY ||
  "your-secret-key-32-chars-123456789012"; // Must be 32 characters
const IV_LENGTH = 16; // For AES, this is always 16

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decrypt = (text: string): string => {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const generateHash = (exportData: object): string => {
  const stringified = JSON.stringify(exportData);
  return crypto.createHash("sha256").update(stringified).digest("hex");
};

export const verifyPipelineIntegrity = (
  pipelineData: object,
  originalHash: string,
): boolean => {
  const currentHash = generateHash(pipelineData);
  return currentHash === originalHash;
};

export const createProtectedExport = (data: object) => {
  const exportData = {
    metadata: {
      version: "1.0",
      timestamp: new Date().toISOString(),
    },
    data: data,
  };

  // Convert to string and encrypt
  const stringified = JSON.stringify(exportData);
  const encrypted = encrypt(stringified);

  const hash = generateHash(exportData);
  return {
    _encrypted: encrypted,
    _integrity: `sha256-${hash}`,
  };
};

export const decryptImport = (encryptedExport: {
  _encrypted: string;
  _integrity?: string;
}) => {
  try {
    const decrypted = decrypt(encryptedExport._encrypted);
    const parsed = JSON.parse(decrypted);

    // Verify integrity if hash is provided
    if (encryptedExport._integrity) {
      const hash = encryptedExport._integrity.replace("sha256-", "");
      if (!verifyPipelineIntegrity(parsed, hash)) {
        throw new Error(
          "Data integrity check failed - file may have been tampered with",
        );
      }
    }

    return parsed;
  } catch (e) {
    throw new Error(`Failed to parse the file with error: ${e}`);
  }
};
