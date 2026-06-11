const { supabase, bucketName } = require('../config/supabase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Uploads a file to Supabase Storage
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder name in the bucket
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
const uploadToSupabase = async (file, folder) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileName = `${folder}/${uuidv4()}_${path.parse(file.originalname).name}${path.extname(file.originalname)}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Supabase Storage Upload Error:', error);
    throw error;
  }
};

module.exports = {
  uploadToSupabase,
  // Keep the old name as alias if needed, but we will update the controller
  uploadToFirebase: uploadToSupabase, 
};
