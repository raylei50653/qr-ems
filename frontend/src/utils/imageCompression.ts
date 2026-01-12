import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  // Options for compression
  const options = {
    maxSizeMB: 1,          // Target max size in MB
    maxWidthOrHeight: 1920, // Resize to fit within 1920x1920
    useWebWorker: true,    // Run in web worker to avoid blocking UI
    initialQuality: 0.7,   // Compression quality (0 to 1)
    fileType: 'image/jpeg' // Convert to JPEG
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Create a new file with the same name but .jpg extension if needed, 
    // although browser-image-compression might handle the type conversion.
    // We ensure the return type is File.
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Fallback: return original file if compression fails
    return file;
  }
};
