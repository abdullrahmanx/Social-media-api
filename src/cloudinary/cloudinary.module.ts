import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryConfig } from './cloudinary.provider';
import {v2 as cloudinary} from 'cloudinary'
@Module({
  providers: [CloudinaryService,CloudinaryConfig],
  exports: [CloudinaryService]
})
export class CloudinaryModule {}
