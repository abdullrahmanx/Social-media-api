import { BadRequestException, Injectable } from '@nestjs/common';
import {v2 as cloudinary} from 'cloudinary'
import path from 'path';
@Injectable()
export class CloudinaryService {

   
   private readonly allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/mpeg'
    ];
    private readonly allowedExtensions= [
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.pdf',
        '.doc',
        '.docx',
        '.mp4',
        '.mov',
        '.avi',
        '.wmv',
        '.mpeg'
    ]
    private readonly mimeToExtMap: Record<string, string[]> = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'video/mp4': ['.mp4'],
        'video/quicktime': ['.mov'],
        'video/x-msvideo': ['.avi'],
        'video/x-ms-wmv': ['.wmv'],
        'video/mpeg': ['.mpeg']
    }

    private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024      
    private readonly MAX_DOCUMENT_SIZE = 10 * 1024 * 1024   
    private readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024 

    async uploadFile(file: Express.Multer.File, folder: string) {
        if(!file) {
            throw new BadRequestException('No file uploaded')
        }
        if(!file.buffer || file.size === 0) {
            throw new BadRequestException('File is empty')
        }
        
        if(!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(`Invalid mimetype, allowed mimetypes: ${this.allowedMimeTypes.join(', ')}`)
        }

        const fileExt= path.extname(file.originalname).toLowerCase()
        if(!this.allowedExtensions.includes(fileExt)) {
            throw new BadRequestException(`Invalid ext type, allowed extensions: ${this.allowedExtensions.join(', ')}`)
        }


        
        const expectedExt= this.mimeToExtMap[file.mimetype]
        if(!expectedExt.includes(fileExt)) {
            throw new BadRequestException('File extension does not match file type - possible spoofing detected');
        }

        let resourceType : "image" | "video" | "gif" | "doc" | "raw"
        let maxSize: number

        if(file.mimetype.startsWith('image/')) {
            resourceType= 'image',
            maxSize= this.MAX_IMAGE_SIZE
        }else if (file.mimetype.startsWith('video/')) {
            resourceType= 'video'
            maxSize= this.MAX_VIDEO_SIZE
        } else {
            resourceType= 'raw'
            maxSize= this.MAX_DOCUMENT_SIZE
        }

        if(file.size > maxSize) {
            throw new BadRequestException(`File too large. Maximum size: ${maxSize / 1024 / 1024} MB`);
        }

        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {folder, resource_type: resourceType},
                (error,result) => {
                    if (error) {
                        return reject(new BadRequestException('Error uploading file'))
                    }
                    resolve(result)    
                }
            ).end(file.buffer)
        }) 
    }

    async deleteFile(publid_id: string, resource_type: "image" | "video" | "gif" | "doc" | "raw") {
        try {
            const result= await cloudinary.uploader.destroy(publid_id,{resource_type})
            if(result.result !== 'ok') {
                throw new BadRequestException('File delete failed')
            }       
        }catch(err) {
            throw new BadRequestException('Error deleting file');
        }
    }
}
