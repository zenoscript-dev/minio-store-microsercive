import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BufferedFile } from 'src/minio-client/file.model';
import { MinioClientService } from 'src/minio-client/minio-client.service';
import {
  mimeTypes,
  refrenceTypes,
} from 'src/minio-client/types/refrenceTypes.types';

@Injectable()
export class ImageUploaderService {
  constructor(private minioClientService: MinioClientService) {}

  public async uploadImage(image: BufferedFile, userId: string) {
    try {
      const uploadedImage = await this.minioClientService.upload(image, userId);
      return {
        image_url: uploadedImage.url,
        message: 'Image upload successful',
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new HttpException('Image upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getFile(key: string) {
    return await this.minioClientService.get(key);
  }
}
