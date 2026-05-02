import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Keep original filename but make it unique
    const originalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const extension = file.originalname.split('.').pop();
    const uniqueId = Math.floor(1000 + Math.random() * 9000);
    const publicId = `${originalName}_${uniqueId}.${extension}`;

    return {
      folder: 'work-management-system',
      resource_type: 'raw', // Enforce raw for documents to avoid transformation issues
      public_id: publicId
    };
  },
});

const upload = multer({ storage: storage });

export default upload;
