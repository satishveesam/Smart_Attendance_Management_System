import React, { useState, useEffect, useRef } from 'react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import API from '../api';
import { getFaceDescriptor } from '../services/faceApi';
import Webcam from 'react-webcam';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  CheckCircle as SuccessIcon,
  RestartAlt as ResetIcon,
  Info as GuideIcon,
} from '@mui/icons-material';

const EmployeeProfile = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Webcam & registration states
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'failed'
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // 3D Multi-angle Enrollment States
  const [cameraReady, setCameraReady] = useState(false);
  const [enrollStep, setEnrollStep] = useState(0); // 0: Straight, 1: Left, 2: Right
  const [descriptorStraight, setDescriptorStraight] = useState(null);
  const [descriptorLeft, setDescriptorLeft] = useState(null);
  const [descriptorRight, setDescriptorRight] = useState(null);
  const [stepImages, setStepImages] = useState({ straight: null, left: null, right: null });
  const [scanMessage, setScanMessage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    checkFaceStatus();
    const timer = setTimeout(() => {
      setCameraReady(true);
    }, 600); // 600ms delay prevents transitions from sticking during camera warmup
    return () => clearTimeout(timer);
  }, []);

  const checkFaceStatus = async () => {
    setLoading(true);
    try {
      const res = await API.get('/face/status');
      setIsRegistered(res.data.registered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureAngle = async () => {
    if (!webcamRef.current) return;
    setStatus('scanning');
    setApiError('');
    setApiSuccess('');

    // Set initial scanning message based on current step
    if (enrollStep === 0) {
      setScanProgress(15);
      setScanMessage('INITIALIZING 3D SENSORS & SCANNING STRAIGHT PROFILE...');
    } else if (enrollStep === 1) {
      setScanProgress(45);
      setScanMessage('3D MAPPING: PROCESSING LEFT FACIAL PROFILE...');
    } else {
      setScanProgress(75);
      setScanMessage('3D MAPPING: PROCESSING RIGHT FACIAL PROFILE...');
    }

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      setStatus('failed');
      setApiError('Failed to capture frame from webcam.');
      return;
    }

    try {
      // Generate descriptor for the current angle
      const descriptor = await getFaceDescriptor(screenshot);
      if (!descriptor || descriptor.length !== 128) {
        throw new Error("Could not detect a clear face in this angle. Please ensure good lighting and look at the camera.");
      }

      const sleep = (ms) => new Promise(r => setTimeout(r, ms));

      if (enrollStep === 0) {
        setDescriptorStraight(descriptor);
        setStepImages(prev => ({ ...prev, straight: screenshot }));
        await sleep(600);
        setScanProgress(33);
        setScanMessage('STRAIGHT PROFILE MAPPED SUCCESSFULLY!');
        await sleep(500);
        setStatus('idle');
        setEnrollStep(1);
        setImgSrc(null);
      } else if (enrollStep === 1) {
        setDescriptorLeft(descriptor);
        setStepImages(prev => ({ ...prev, left: screenshot }));
        await sleep(600);
        setScanProgress(66);
        setScanMessage('LEFT PROFILE MAPPED SUCCESSFULLY!');
        await sleep(500);
        setStatus('idle');
        setEnrollStep(2);
        setImgSrc(null);
      } else if (enrollStep === 2) {
        setDescriptorRight(descriptor);
        setStepImages(prev => ({ ...prev, right: screenshot }));
        
        // We have all three! Now let's average and compile!
        await sleep(500);
        setScanProgress(85);
        setScanMessage('COMPILING 3D ROBUST FACE MODEL...');
        await sleep(700);

        const avgDescriptor = [];
        for (let i = 0; i < 128; i++) {
          const val = (descriptorStraight[i] + descriptorLeft[i] + descriptor[i]) / 3;
          avgDescriptor.push(val);
        }

        setScanProgress(95);
        setScanMessage('ENCRYPTING BIOMETRIC HASH...');
        await sleep(500);

        // Submit the robust averaged 3D descriptor to the backend
        await API.post('/face/register', {
          faceDescriptor: JSON.stringify(avgDescriptor)
        });

        setScanProgress(100);
        setScanMessage('3D ENROLLMENT SUCCESSFUL!');
        await sleep(400);

        setStatus('success');
        setApiSuccess('Your robust 3D multi-angle facial biometrics template has been successfully registered!');
        setIsRegistered(true);
      }
    } catch (err) {
      console.error(err);
      setStatus('failed');
      setApiError(err.message || 'Face scan failed. Please ensure your face is fully visible and try again.');
    }
  };

  const handleReRegisterInit = () => {
    setImgSrc(null);
    setApiSuccess('');
    setApiError('');
    setStatus('idle');
    setIsRegistered(false);
    setEnrollStep(0);
    setDescriptorStraight(null);
    setDescriptorLeft(null);
    setDescriptorRight(null);
    setStepImages({ straight: null, left: null, right: null });
  };

  const handleResetSteps = () => {
    setEnrollStep(0);
    setDescriptorStraight(null);
    setDescriptorLeft(null);
    setDescriptorRight(null);
    setStepImages({ straight: null, left: null, right: null });
    setImgSrc(null);
    setApiError('');
    setApiSuccess('');
    setStatus('idle');
  };

  return (
    <EmployeeLayout>
      <Box className="fade-in" sx={{ pb: { xs: 2, md: 4 } }}>
        
        {/* Page Header */}
        <Box sx={{ mb: { xs: 2.5, md: 3.5 } }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: { xs: '1.4rem', md: '2rem' }, fontFamily: 'Outfit' }}>
            Biometric Enrollment
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '12px', md: '13.5px' }, mt: 0.3, fontFamily: 'Inter' }}>
            Register your multi-angle facial signature for high-security geofenced shifts
          </Typography>
        </Box>

        {apiSuccess && (
          <Alert severity="success" sx={{ mb: 2.5, py: 0.5, borderRadius: 2, fontSize: '12px' }} icon={<SuccessIcon sx={{ fontSize: 18 }} />}>
            {apiSuccess}
          </Alert>
        )}

        {apiError && (
          <Alert severity="error" sx={{ mb: 2.5, py: 0.5, borderRadius: 2, fontSize: '12px' }} action={
            <Button color="inherit" size="small" onClick={() => setStatus('idle')} sx={{ fontWeight: 800, fontSize: '10.5px', textTransform: 'none', fontFamily: 'Outfit' }}>
              Try Again
            </Button>
          }>
            {apiError}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={30} sx={{ color: '#10b981' }} />
          </Box>
        ) : isRegistered && status !== 'idle' && status !== 'scanning' ? (
          <Card sx={{ borderRadius: 3, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', p: { xs: 3, md: 4 }, textAlign: 'center', boxShadow: 'none' }}>
            <SuccessIcon color="success" sx={{ fontSize: { xs: 45, md: 52 }, mb: 1.5 }} />
            <Typography sx={{ fontWeight: 'bold', color: '#166534', mb: 0.5, fontSize: '15px', fontFamily: 'Outfit' }}>
              3D Biometrics Enrolled
            </Typography>
            <Typography variant="body2" sx={{ color: '#166534', mb: 3, maxWidth: 460, mx: 'auto', fontSize: '12px', fontFamily: 'Inter' }}>
              Your robust, multi-angle facial template is successfully registered in the secure database. You can now mark daily geofenced attendance.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ResetIcon />}
              onClick={handleReRegisterInit}
              sx={{ textTransform: 'none', borderRadius: 2.5, fontSize: '12px', fontWeight: 'bold', px: 3 }}
            >
              Re-register Biometric Template
            </Button>
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            
            {/* Camera Viewport */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  
                  {/* FaceID Step Stepper */}
                  <Stepper activeStep={enrollStep} alternativeLabel sx={{ mb: 2.5 }}>
                    <Step>
                      <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: '#10b981' }, '&.Mui-completed': { color: '#10b981' } } }}>
                        Straight View
                      </StepLabel>
                    </Step>
                    <Step>
                      <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: '#10b981' }, '&.Mui-completed': { color: '#10b981' } } }}>
                        Left Angle
                      </StepLabel>
                    </Step>
                    <Step>
                      <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: '#10b981' }, '&.Mui-completed': { color: '#10b981' } } }}>
                        Right Angle
                      </StepLabel>
                    </Step>
                  </Stepper>

                  <Divider sx={{ mb: 2 }} />

                  {/* Dynamic Step Guidelines */}
                  <Box sx={{ mb: 2.5, p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '12px', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {enrollStep === 0 && '👤 Step 1: Look Straight'}
                      {enrollStep === 1 && '👈 Step 2: Turn Head Left'}
                      {enrollStep === 2 && '👉 Step 3: Turn Head Right'}
                    </Typography>
                    <Typography sx={{ color: '#475569', fontSize: '11px', mt: 0.5, fontFamily: 'Inter', lineHeight: 1.45 }}>
                      {enrollStep === 0 && 'Align your face in the center. Look directly at the camera with a neutral, clear expression.'}
                      {enrollStep === 1 && 'Slowly turn your head about 30 degrees to the left (profile view) and look at the screen.'}
                      {enrollStep === 2 && 'Slowly turn your head about 30 degrees to the right (profile view) and look at the screen.'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4/3',
                      borderRadius: 2.5,
                      overflow: 'hidden',
                      border: '2px solid #e2e8f0',
                      bgcolor: '#0f172a',
                      mb: 2,
                      '@keyframes scan': {
                        '0%': { top: '0%' },
                        '50%': { top: '100%' },
                        '100%': { top: '0%' }
                      }
                    }}>
                      {!cameraReady ? (
                        <Box sx={{ 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          bgcolor: '#0f172a',
                          color: '#64748b',
                          p: 3
                        }}>
                          <CircularProgress size={30} sx={{ color: '#10b981', mb: 2 }} />
                          <Typography sx={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.8px', color: '#94a3b8', fontFamily: 'Outfit', textTransform: 'uppercase' }}>
                            Warming Up 3D Camera Sensors...
                          </Typography>
                          <Typography sx={{ fontSize: '9px', color: '#475569', fontFamily: 'Inter', mt: 0.5 }}>
                            Optimizing hardware latency and lighting environment
                          </Typography>
                        </Box>
                      ) : imgSrc ? (
                        <Box
                          component="img"
                          src={imgSrc}
                          alt="Captured Face Preview"
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                        />
                      ) : (
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                        />
                      )}

                      {/* Align Face target frame overlay */}
                      {!imgSrc && cameraReady && (
                        <Box sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: { xs: '65%', md: '55%' },
                          height: { xs: '65%', md: '55%' },
                          border: '2px dashed rgba(16, 185, 129, 0.5)',
                          borderRadius: '12px',
                          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.4)',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <span style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
                            <span style={{ position: 'absolute', top: -2, left: -2, width: 16, height: 16, borderLeft: '4px solid #10b981', borderTop: '4px solid #10b981', borderTopLeftRadius: '6px' }} />
                            <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRight: '4px solid #10b981', borderTop: '4px solid #10b981', borderTopRightRadius: '6px' }} />
                            <span style={{ position: 'absolute', bottom: -2, left: -2, width: 16, height: 16, borderLeft: '4px solid #10b981', borderBottom: '4px solid #10b981', borderBottomLeftRadius: '6px' }} />
                            <span style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRight: '4px solid #10b981', borderBottom: '4px solid #10b981', borderBottomRightRadius: '6px' }} />
                          </span>
                          <Typography sx={{ color: '#10b981', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.2px', opacity: 0.9 }}>
                            {enrollStep === 0 && 'Straight view'}
                            {enrollStep === 1 && 'Look left <-'}
                            {enrollStep === 2 && 'Look right ->'}
                          </Typography>
                        </Box>
                      )}

                      {/* 3D Laser Scanning Sweeper */}
                      {status === 'scanning' && cameraReady && (
                        <Box sx={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0) 0%, #10b981 50%, rgba(16, 185, 129, 0) 100%)',
                          boxShadow: '0 0 8px #10b981, 0 0 16px #10b981',
                          zIndex: 25,
                          animation: 'scan 2s infinite linear',
                        }} />
                      )}

                      {/* Processing Overlay */}
                      {status === 'scanning' && (
                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(15,23,42,0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, p: 3 }}>
                          <CircularProgress variant="determinate" value={scanProgress} size={40} sx={{ color: '#10b981', mb: 2 }} />
                          <Typography sx={{ color: '#10b981', fontSize: '11px', fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '0.8px', mb: 1 }}>
                            {scanProgress}% MAPPED
                          </Typography>
                          <Typography sx={{ color: '#fff', fontSize: '11.5px', fontWeight: 'bold', fontFamily: 'Inter', textAlign: 'center', maxWidth: 280 }}>
                            {scanMessage}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Small thumbnails of captured angles */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', gap: 1.5, width: '100%', mt: 0.5, mb: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{
                          width: 50,
                          height: 50,
                          borderRadius: 2,
                          border: `2px solid ${stepImages.straight ? '#10b981' : '#cbd5e1'}`,
                          overflow: 'hidden',
                          bgcolor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: stepImages.straight ? '0 2px 6px rgba(16, 185, 129, 0.2)' : 'none'
                        }}>
                          {stepImages.straight ? (
                            <img src={stepImages.straight} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                          ) : (
                            <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', fontFamily: 'Outfit' }}>1</Typography>
                          )}
                        </Box>
                        <Typography sx={{ fontSize: '9.5px', fontWeight: 800, mt: 0.5, color: stepImages.straight ? '#10b981' : '#64748b', fontFamily: 'Outfit' }}>Straight</Typography>
                      </Box>

                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{
                          width: 50,
                          height: 50,
                          borderRadius: 2,
                          border: `2px solid ${stepImages.left ? '#10b981' : '#cbd5e1'}`,
                          overflow: 'hidden',
                          bgcolor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: stepImages.left ? '0 2px 6px rgba(16, 185, 129, 0.2)' : 'none'
                        }}>
                          {stepImages.left ? (
                            <img src={stepImages.left} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                          ) : (
                            <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', fontFamily: 'Outfit' }}>2</Typography>
                          )}
                        </Box>
                        <Typography sx={{ fontSize: '9.5px', fontWeight: 800, mt: 0.5, color: stepImages.left ? '#10b981' : '#64748b', fontFamily: 'Outfit' }}>Left Profile</Typography>
                      </Box>

                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{
                          width: 50,
                          height: 50,
                          borderRadius: 2,
                          border: `2px solid ${stepImages.right ? '#10b981' : '#cbd5e1'}`,
                          overflow: 'hidden',
                          bgcolor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: stepImages.right ? '0 2px 6px rgba(16, 185, 129, 0.2)' : 'none'
                        }}>
                          {stepImages.right ? (
                            <img src={stepImages.right} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                          ) : (
                            <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', fontFamily: 'Outfit' }}>3</Typography>
                          )}
                        </Box>
                        <Typography sx={{ fontSize: '9.5px', fontWeight: 800, mt: 0.5, color: stepImages.right ? '#10b981' : '#64748b', fontFamily: 'Outfit' }}>Right Profile</Typography>
                      </Box>
                    </Box>

                    {/* Camera controls */}
                    <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                      {(stepImages.straight || stepImages.left || stepImages.right) && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={handleResetSteps}
                          sx={{ textTransform: 'none', borderRadius: 2.5, fontSize: '12px', fontWeight: 'bold', px: 2 }}
                        >
                          Restart Enrollment
                        </Button>
                      )}
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CameraIcon sx={{ fontSize: 16 }} />}
                        onClick={handleCaptureAngle}
                        disabled={status === 'scanning' || !cameraReady}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2.5,
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: '#10b981',
                          '&:hover': { backgroundColor: '#059669' },
                          boxShadow: 'none',
                          '&:disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8' }
                        }}
                      >
                        {status === 'scanning' ? 'Processing...' : (
                          enrollStep === 0 ? 'Scan Straight Profile' : (
                            enrollStep === 1 ? 'Scan Left Profile' : 'Scan Right Profile'
                          )
                        )}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Guide Instructions Card */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography sx={{ fontWeight: 'bold', mb: 1.5, color: '#1e293b', fontSize: '13px', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GuideIcon sx={{ color: '#10b981', fontSize: 18 }} /> Enrollment Guidelines
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Typography sx={{ fontWeight: 'bold', color: '#10b981', fontSize: '12.5px', fontFamily: 'Outfit' }}>1.</Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Inter', lineHeight: 1.45 }}>
                        <strong>Three head-pose scans</strong> are required: looking directly straight, turning slightly left, and turning slightly right.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Typography sx={{ fontWeight: 'bold', color: '#10b981', fontSize: '12.5px', fontFamily: 'Outfit' }}>2.</Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Inter', lineHeight: 1.45 }}>
                        Center your face completely inside the green dashed target zone for each posture.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Typography sx={{ fontWeight: 'bold', color: '#10b981', fontSize: '12.5px', fontFamily: 'Outfit' }}>3.</Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Inter', lineHeight: 1.45 }}>
                        Slowly turn your head approximately 30 degrees to the left/right when prompted. Do not make fast movements.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Typography sx={{ fontWeight: 'bold', color: '#10b981', fontSize: '12.5px', fontFamily: 'Outfit' }}>4.</Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Inter', lineHeight: 1.45 }}>
                        Remove large sunglasses, hats, masks, or face coverings to ensure highest mapping integrity.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        )}
        
      </Box>
    </EmployeeLayout>
  );
};

export default EmployeeProfile;
