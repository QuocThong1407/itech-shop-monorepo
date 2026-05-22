const { supabase, supabaseAdmin} = require("../configs/supabase");
const { v4: uuidv4 } = require("uuid");

const uploadImageToSupabase = async (file, bucket, folder = "") => {
  try {
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${folder}${uuidv4()}.${fileExt}`;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

const deleteImageFromSupabase = async (imageUrl, bucket) => {
  try {
    const url = new URL(imageUrl);
    const filePath = url.pathname.split(
      `/storage/v1/object/public/${bucket}/`
    )[1];

    if (!filePath) throw new Error("Invalid image URL");

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Delete image error:", error.message);
    return false;
  }
};

module.exports = {
  uploadImageToSupabase,
  deleteImageFromSupabase,
};
