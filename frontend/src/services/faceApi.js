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
          // Detect eye closure using Eye Aspect Ratio (EAR)
          const landmarks = detection.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          
          const calculateDistance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
          const getEAR = (eye) => (calculateDistance(eye[1], eye[5]) + calculateDistance(eye[2], eye[4])) / (2 * calculateDistance(eye[0], eye[3]));
          
          const leftEAR = getEAR(leftEye);
          const rightEAR = getEAR(rightEye);
          const avgEAR = (leftEAR + rightEAR) / 2;
          
          if (avgEAR < 0.20) {
            reject(new Error("Eyes closed detected. Please look directly into the camera with your eyes open to verify liveness."));
            return;
          }
          
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
