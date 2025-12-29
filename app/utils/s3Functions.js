const AWS = require('aws-sdk');
const multer = require('multer');
const { Readable } = require('stream');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

const s3 = new AWS.S3();

async function uploadToS3(buffer, originalFileName, folderPath) {
  try {
    const fileStream = new Readable();
    fileStream.push(buffer);
    fileStream.push(null);

    const key = folderPath + originalFileName;
    const fileExtension = originalFileName.split('.').pop(); 

    // Check if file already exists in S3
    const headObjectParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    try {
      // If the file already exists, generate a random string and append it to the original file name
      await s3.headObject(headObjectParams).promise();
      // const newFileName = `${originalFileName}-${randomString}`;
      const newFileName = originalFileName;
      const newKey = folderPath + newFileName;

      await s3.upload({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: newKey,
        Body: fileStream,
      }).promise();

      console.log('File uploaded successfully. New file name:', newFileName);

      return newFileName;
    } catch (headObjectError) {
      // File does not exist, proceed with the original file name
      try {
        // Check if folderPath exists, if not, create it
        await s3.headObject({ Bucket: process.env.AWS_S3_BUCKET, Key: folderPath }).promise();
      } catch (folderNotExistError) {
        // Folder doesn't exist, create it
        await s3.putObject({ Bucket: process.env.AWS_S3_BUCKET, Key: folderPath }).promise();
      }

      await s3.upload({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: fileStream,
      }).promise();

      console.log('File uploaded successfully. Original file name:', originalFileName);

      return originalFileName;
    }
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw error;
  }
}



async function getFileFromS3(fileName, folderPath) {
  try {
    const key = folderPath + fileName;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    const result = await s3.getObject(params).promise();

    console.log('File retrieved successfully:', result);

    return result.Body;
  } catch (error) {
    console.error('Failed to retrieve file:', error);
    throw error;
  }
}

module.exports = {
  uploadToS3,
  getFileFromS3
};
