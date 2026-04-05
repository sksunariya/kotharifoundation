const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET;

// Expiry in seconds per resource type
const EXPIRY = {
  video: 60 * 60,      // 1 hour  — enough for full video stream
  pdf:   30 * 60,      // 30 min  — inline PDF viewing
  link:  0,            // not used
};

/**
 * Generate a presigned GET URL for a private S3 object.
 * @param {string} s3Key   - S3 object key
 * @param {'video'|'pdf'}  type
 * @param {string} [bucket]
 */
const getPresignedUrl = async (s3Key, type, bucket = DEFAULT_BUCKET) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    // Force inline display in the browser (critical for PDF iframe and video src)
    ResponseContentDisposition: 'inline',
    ResponseContentType: type === 'video' ? 'video/mp4' : 'application/pdf',
  });
  return getSignedUrl(s3, command, { expiresIn: EXPIRY[type] || 3600 });
};

/**
 * Upload a file buffer directly to S3 from the server.
 * @param {string} s3Key
 * @param {Buffer} buffer
 * @param {string} contentType
 * @param {string} [bucket]
 */
const putObject = async (s3Key, buffer, contentType, bucket = DEFAULT_BUCKET) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    Body: buffer,
    ContentType: contentType,
  });
  return s3.send(command);
};

/**
 * Soft-delete the S3 object (actually deletes — only call after soft-deleting the DB record).
 */
const deleteS3Object = async (s3Key, bucket = DEFAULT_BUCKET) => {
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: s3Key });
  return s3.send(command);
};

module.exports = { getPresignedUrl, putObject, deleteS3Object };
