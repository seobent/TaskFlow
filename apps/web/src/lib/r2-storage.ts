import { createHash, createHmac } from "node:crypto";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

type UploadObjectInput = {
  body: ArrayBuffer;
  contentType: string;
  key: string;
};

const region = "auto";
const service = "s3";
const algorithm = "AWS4-HMAC-SHA256";

export class R2ConfigError extends Error {
  constructor(message = "R2 storage is not configured.") {
    super(message);
    this.name = "R2ConfigError";
  }
}

export async function uploadR2Object({
  body,
  contentType,
  key,
}: UploadObjectInput) {
  const config = getR2Config();
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodePathSegment(config.bucketName)}/${encodeObjectKey(key)}`;
  const endpoint = `https://${host}${canonicalUri}`;
  const payload = Buffer.from(body);
  const payloadHash = sha256Hex(payload);
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = getSignatureKey(
    config.secretAccessKey,
    dateStamp,
    region,
    service,
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");
  const authorization = `${algorithm} Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(endpoint, {
    body: payload,
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed with status ${response.status}.`);
  }

  return `${config.publicUrl}/${encodeObjectKey(key)}`;
}

function getR2Config(): R2Config {
  const accountId = readRequiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = readRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = readRequiredEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = readRequiredEnv("R2_BUCKET_NAME");
  const publicUrl = readRequiredEnv("R2_PUBLIC_URL").replace(/\/+$/, "");

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
  };
}

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new R2ConfigError(`${name} is required for attachment storage.`);
  }

  return value;
}

function getSignatureKey(
  secretAccessKey: string,
  dateStamp: string,
  signingRegion: string,
  signingService: string,
) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmac(dateKey, signingRegion);
  const dateRegionServiceKey = hmac(dateRegionKey, signingService);

  return hmac(dateRegionServiceKey, "aws4_request");
}

function hmac(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function sha256Hex(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function encodeObjectKey(key: string) {
  return key.split("/").map(encodePathSegment).join("/");
}

function encodePathSegment(segment: string) {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
