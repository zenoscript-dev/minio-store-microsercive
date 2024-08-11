import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MinioClient, MinioService } from 'nestjs-minio-client';
import * as crypto from 'crypto';
import { BufferedFile } from './file.model';
import { mimeTypes, refrenceTypes } from './types/refrenceTypes.types';

@Injectable()
export class MinioClientService {
  constructor(private readonly minio: MinioService) {
    this.logger = new Logger('MinioService');

    // THIS IS THE POLICY
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: ['*'],
          },
          Action: [
            's3:ListBucketMultipartUploads',
            's3:GetBucketLocation',
            's3:ListBucket',
          ],
          Resource: ['arn:aws:s3:::test-bucket'], // Change this according to your bucket name
        },
        {
          Effect: 'Allow',
          Principal: {
            AWS: ['*'],
          },
          Action: [
            's3:PutObject',
            's3:AbortMultipartUpload',
            's3:DeleteObject',
            's3:GetObject',
            's3:ListMultipartUploadParts',
          ],
          Resource: ['arn:aws:s3:::test-bucket/*'], // Change this according to your bucket name
        },
      ],
    };

    this.client.setBucketPolicy(
      process.env.MINIO_BUCKET_NAME,
      JSON.stringify(policy),
      function (err) {
        if (err) throw err;

        console.log('Bucket policy set');
      },
    );
  }

  private readonly logger: Logger;
  private readonly bucketName = process.env.MINIO_BUCKET_NAME;

  public get client() {
    return this.minio.client;
  }

  public async upload(
    file: BufferedFile,
    userId: string,
    bucketName: string = this.bucketName,
  ) {

    // Check for supported file types
    if (!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))) {
      throw new HttpException('File type not supported', HttpStatus.BAD_REQUEST);
    }

    // Generate a unique file name
    const timestamp = Date.now().toString();
    const hashedFileName = crypto.createHash('md5').update(timestamp).digest('hex');
    const extension = file.originalname.substring(file.originalname.lastIndexOf('.'));

    // Set metadata
    const metaData = {
      'Content-Type': file.mimetype,
      'mimetype': file.mimetype,
      'userid': userId,
    };

    // Generate file name and unique URL
    const fileName = hashedFileName + extension;
    const unqurl = await this.encodeAndDecodeFileUri({ userId, fileName }, 'construct');

    try {
      // // Extract and validate buffer
      // if (!Buffer.isBuffer(file.buffer)) {
      //   throw new HttpException('Invalid file buffer', HttpStatus.BAD_REQUEST);
      // }

      // // Convert file.buffer to a proper Buffer if needed
      // const fileBuffer = Buffer.from(file.buffer['data']);

      // Upload file to MinIO
      const upoloadedFile = await this.client.putObject(bucketName, unqurl, await Buffer.from(file.buffer['data']), metaData);
      return { url: unqurl };
    } catch (error) {
      console.error('Error during MinIO upload:', error);
      throw new HttpException('File upload to MinIO failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(objetName: string, bucketName: string = this.bucketName) {
    this.client.removeObject(bucketName, objetName);
  }

  async get(objetName: string, bucketName: string = this.bucketName) {
    return await this.client.presignedUrl('GET', this.bucketName, objetName);
  }

  private async encodeAndDecodeFileUri(
    details: {
      userId: string;
      fileName: string;
    },
    type: 'construct' | 'deconstruct',
  ): Promise<string> {
    const { userId, fileName } = details;
    let url;
    if (type === 'construct') {
      url = `${userId}_${process.env.MINIO_FILE_UNQ_ID}_${fileName}`;
    }
    return url;
  }
}
