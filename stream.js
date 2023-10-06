const { S3 } = require('@aws-sdk/client-s3');
const s3Config = require('...YOUR_S3_CONFIG_FILE...')

// #1
const s3AwsClient = new S3({
    credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey
    },
    region: s3Config.region,
    endpoint: 'https://' + s3Config.endpoint
});

async (req, res, next) => {
  // #2
  const s3Options = {
    Bucket: s3Config.bucket,
    Key: objectKey // key to your object in S3
  };

  // #3
  const { ContentLength } = await s3AwsClient.headObject(s3Options);
  const videoSize = ContentLength;

  // #4
  const FILE_PORTION_SIZE = 5000000; //bytes = 5MB
  const requestedRange = req.headers.range || '';
  const start = Number(requestedRange.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;

  // #5
  res.status(206);
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Range', `bytes ${start}-${end}/${videoSize}`);
  res.setHeader('Content-Length', contentLength);

  // #6
  const streamRange = `bytes=${start}-${end}`;
  const s3Object = await s3AwsClient.getObject({
    ...s3Options,
    Range: streamRange
  });

  // #7  
  s3Object.Body.pipe(res);
}
