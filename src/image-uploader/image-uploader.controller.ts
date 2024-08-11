import {
  Controller,
  DefaultValuePipe,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ImageUploaderService } from './image-uploader.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from 'src/minio-client/file.model';
import { query } from 'express';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  mimeTypes,
  refrenceTypes,
} from 'src/minio-client/types/refrenceTypes.types';

@Controller('image-uploader')
export class ImageUploaderController {
  constructor(private readonly imageUploaderService: ImageUploaderService) {}

  @EventPattern("image-upload")
  async uploadImage(@Payload() data: {file: BufferedFile, userId: "asdsadasd"}) {
    return await this.imageUploaderService.uploadImage(data.file, data.userId);
  }

  @MessagePattern('image-details')
  async getBookCover(@Payload() data: { url: string }) {
    const key = data.url || null; // Extract 'key' from the data payload
    const fileUrl = await this.imageUploaderService.getFile(key);
    return fileUrl;
  }

  @MessagePattern('test')
  async testEvent(@Payload() data: { userId: string }) {
    return data.userId;
  }
}
