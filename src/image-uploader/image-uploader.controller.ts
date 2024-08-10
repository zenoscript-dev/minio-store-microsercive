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

@Controller('image-uploader')
export class ImageUploaderController {
  constructor(private readonly imageUploaderService: ImageUploaderService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() image: BufferedFile) {
    return await this.imageUploaderService.uploadImage(image);
  }

  @Get()
  async getBookCover(@Query('key', new DefaultValuePipe(null)) key: string) {
    const fileUrl = await this.imageUploaderService.getFile(key);
    return fileUrl;
  }
}
