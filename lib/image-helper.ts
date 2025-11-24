import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageAspectRatio = (width: number, height: number): ImageValidationResult => {
  const aspectRatio = height / width; // y:x
  
  // Min 1:1 (aspectRatio = 1), Max 2400:1080 = 2.223 (aspectRatio = 2.223)
  if (aspectRatio < 1 || aspectRatio > 2.223) {
    return {
      valid: false,
      error: 'Image aspect ratio must be between 1:1 and 2400:1080 (height:width)'
    };
  }
  
  return { valid: true };
};

export const pickAndProcessImage = async (): Promise<{ image: string; thumbnail: string } | null> => {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }
  
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });
  
  if (result.canceled) {
    return null;
  }
  
  const asset = result.assets[0];
  
  // Validate aspect ratio
  const validation = validateImageAspectRatio(asset.width, asset.height);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Validate max resolution
  if (asset.width > 1080 || asset.height > 2400) {
    throw new Error('Image resolution must not exceed 1080x2400');
  }
  
  const processedImage = asset.uri;
  
  // Create thumbnail (2:1 aspect ratio height:width) with cropping
  const targetRatio = 2; // height:width
  const currentRatio = asset.height / asset.width;
  
  let cropWidth = asset.width;
  let cropHeight = asset.height;
  let originX = 0;
  let originY = 0;
  
  if (currentRatio > targetRatio) {
    // Image is taller than target, crop height
    cropHeight = asset.width * targetRatio;
    originY = (asset.height - cropHeight) / 2;
  } else {
    // Image is wider than target, crop width
    cropWidth = asset.height / targetRatio;
    originX = (asset.width - cropWidth) / 2;
  }
  
  const thumbnailResult = await ImageManipulator.manipulateAsync(
    processedImage,
    [
      { crop: { originX, originY, width: cropWidth, height: cropHeight } },
      { resize: { width: 90, height: 180 } }
    ],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  
  return {
    image: processedImage,
    thumbnail: thumbnailResult.uri
  };
};
