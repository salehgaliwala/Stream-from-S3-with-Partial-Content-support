const { S3 } = require('@aws-sdk/client-s3');
const s3Config = require('...YOUR_S3_CONFIG_FILE...')

// #1 Create the S3 client. If the code above doesn't work you can find more information here.
const s3AwsClient = new S3({
    credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey
    },
    region: s3Config.region,
    endpoint: 'https://' + s3Config.endpoint
});

async (req, res, next) => {
  // #2 s3Options contain the bucket name and the key of the file you want to access.
  const s3Options = {
    Bucket: s3Config.bucket,
    Key: objectKey // key to your object in S3
  };

  // #3 The headObject function allows us to get information about the file. In our case we are interested in the ContentLength of the file.
  const { ContentLength } = await s3AwsClient.headObject(s3Options);
  const videoSize = ContentLength;

  // #4 In this step we calculate the ranges of the file portion we want to return. After this we will have start, end and contentLength. Note that in the FILE_PORTION_SIZE variable we define the size we want to return. You can change this to your needs.
  const FILE_PORTION_SIZE = 5000000; //bytes = 5MB
  const requestedRange = req.headers.range || '';
  const start = Number(requestedRange.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;

  // #5 Since we want to support Partial content requests, we need to set the correct response code (206), Content-Range and Content-Length headers.
  res.status(206);
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Range', `bytes ${start}-${end}/${videoSize}`);
  res.setHeader('Content-Length', contentLength);

  // #6 Now it's time to get the object from S3! For that we use getObject function. Note that we are passing the range here, if you forget this you will get the entire file.
  const streamRange = `bytes=${start}-${end}`;
  const s3Object = await s3AwsClient.getObject({
    ...s3Options,
    Range: streamRange
  });

  // #7  The property Body of the object returned by getObject is a stream, so we will pipe it to the response (res) object.
  s3Object.Body.pipe(res);
}
