import * as faceapi from 'face-api.js';

// CDN URL holding standard face-api.js model weights
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/';

let modelsLoaded = false;

export const loadFaceApiModels = async () => {
  if (modelsLoaded) return true;
  try {
    console.log("Loading face-api.js models...");
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
    console.log("Models loaded successfully");
    return true;
  } catch (error) {
    console.error("Failed to load face-api.js models from CDN", error);
    throw new Error("Facial biometrics engine failure: Models could not be loaded.");
  }
};

export const getFaceDescriptor = async (imageSrc) => {
  await loadFaceApiModels();
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = async () => {
      try {
        const detection = await faceapi.detectSingleFace(
          img,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();
        
        if (!detection) {
          reject(new Error("No face detected in photo. Please ensure your face is fully visible and try again."));
        } else {
          resolve(Array.from(detection.descriptor));
        }
      } catch (err) {
        console.error("Face detection error: ", err);
        reject(new Error("Error analyzing facial biometrics."));
      }
    };
    img.onerror = () => {
      reject(new Error("Failed to load captured selfie."));
    };
  });
};
