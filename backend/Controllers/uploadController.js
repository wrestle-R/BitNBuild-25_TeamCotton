const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadController = {
  // Upload image
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
        });
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "image",
              folder: "nourishnet/menu",
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          )
          .end(req.file.buffer);
      });

      res.status(200).json({
        success: true,
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          originalName: req.file.originalname,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to upload image: ${error.message}`,
      });
    }
  }
};

module.exports = uploadController;