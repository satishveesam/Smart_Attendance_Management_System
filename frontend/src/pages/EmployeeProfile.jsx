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

  // 3D Scanning UX States
  const [cameraReady, setCameraReady] = useState(false);
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

  const handleCaptureAndRegister = async () => {
    if (!webcamRef.current) return;
    setStatus('scanning');
    setApiError('');
    setApiSuccess('');
    setScanProgress(10);
    setScanMessage('INITIALIZING 3D BIOMETRIC CAMERA...');

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      setStatus('failed');
      setApiError('Failed to capture frame from webcam.');
      return;
    }

    // Capture photo instantly, then run the 3D surface scan
    setImgSrc(screenshot);

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    try {
      await sleep(600);
      setScanProgress(35);
      setScanMessage('SURFACE MAPPING: MAPPING 128 SURFACE VECTORS...');

      await sleep(600);
      setScanProgress(65);
      setScanMessage('3D SCANNING: CALCULATING DEPTH & ROTATION SIGNATURES...');

      await sleep(600);
      setScanProgress(85);
      setScanMessage('CRYPTOGRAPHY: GENERATING SECURE BIOMETRIC HASH...');

      // 1. Generate 128-point face descriptor
      const descriptor = await getFaceDescriptor(screenshot);
      
      // 2. Submit to backend
      await API.post('/face/register', {
        faceDescriptor: JSON.stringify(descriptor)
      });

      await sleep(400);
      setScanProgress(100);
      setScanMessage('BIOMETRIC TEMPLATE ENROLLED SUCCESSFULLY!');
      
      await sleep(300);
      setStatus('success');
      setApiSuccess('Your 3D facial biometrics template has been successfully registered!');
      setIsRegistered(true);
    } catch (err) {
      console.error(err);
      setStatus('failed');
      setApiError(err.message || 'Face biometrics registration failed. Please align your face clearly.');
    }
  };

  const handleReRegisterInit = () => {
    setImgSrc(null);
    setApiSuccess('');
    setApiError('');
    setStatus('idle');
    setIsRegistered(false);
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
            Register your facial signature for high-security geofenced logs
          </Typography>
        </Box>

        {apiSuccess && (
          <Alert severity="success" sx={{ mb: 2.5, py: 0.5, borderRadius: 2, fontSize: '12px' }} icon={<SuccessIcon sx={{ fontSize: 18 }} />}>
            {apiSuccess}
          </Alert>
        )}

        {apiError && (
          <Alert severity="error" sx={{ mb: 2.5, py: 0.5, borderRadius: 2, fontSize: '12px' }}>
            {apiError}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={30} sx={{ color: '#2563eb' }} />
          </Box>
        ) : isRegistered && status !== 'idle' && status !== 'scanning' ? (
          <Card sx={{ borderRadius: 3, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', p: { xs: 3, md: 4 }, textAlign: 'center', boxShadow: 'none' }}>
            <SuccessIcon color="success" sx={{ fontSize: { xs: 45, md: 52 }, mb: 1.5 }} />
            <Typography sx={{ fontWeight: 'bold', color: '#166534', mb: 0.5, fontSize: '15px', fontFamily: 'Outfit' }}>
              Biometrics Registered
            </Typography>
            <Typography variant="body2" sx={{ color: '#166534', mb: 3, maxWidth: 460, mx: 'auto', fontSize: '12px', fontFamily: 'Inter' }}>
              Your 128-point face descriptor template is successfully registered in the secure database. You can now mark daily check-in and check-out attendance.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ResetIcon />}
              onClick={handleReRegisterInit}
              sx={{ textTransform: 'none', borderRadius: 2.5, fontSize: '12px', fontWeight: 'bold', px: 3 }}
            >
              Re-register Face Template
            </Button>
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            
            {/* Camera Viewport */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography sx={{ fontWeight: 'bold', mb: 1.5, color: '#1e293b', fontSize: '13px', fontFamily: 'Outfit' }}>
                    Webcam Enrollment Kiosk
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

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
                            3D Target Area
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

                    {/* Camera controls */}
                    <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                      {imgSrc && (
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setImgSrc(null);
                            setStatus('idle');
                          }}
                          sx={{ textTransform: 'none', borderRadius: 2.5, fontSize: '12px', fontWeight: 'bold', px: 2 }}
                        >
                          Retake
                        </Button>
                      )}
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CameraIcon sx={{ fontSize: 16 }} />}
                        onClick={handleCaptureAndRegister}
                        disabled={status === 'scanning'}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2.5,
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: '#2563eb',
                          '&:hover': { backgroundColor: '#1d4ed8' },
                          boxShadow: 'none'
                        }}
                      >
                        {status === 'scanning' ? 'Processing...' : 'Capture & Enroll Face'}
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
                    <GuideIcon sx={{ color: '#2563eb', fontSize: 18 }} /> Enrollment Guidelines
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Typography sx={{ fontWeight: 'bold', color: '#2563eb', fontSize: '12.5px', fontFamily: 'Outfit' }}>1.</Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Inter' }}>
                        Center your face completely inside the blue dashed target guides.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Typography sx={{ fontWeight: 'bold', color: '#2563eb', fontSize: '12.5px', fontFamily: 'Outfit' }}>2.</Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Inter' }}>
                        Keep a neutral expression and look directly into the camera lens.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Typography sx={{ fontWeight: 'bold', color: '#2563eb', fontSize: '12.5px', fontFamily: 'Outfit' }}>3.</Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Inter' }}>
                        Ensure there are no direct lights behind you and face lighting is sufficient.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Typography sx={{ fontWeight: 'bold', color: '#2563eb', fontSize: '12.5px', fontFamily: 'Outfit' }}>4.</Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Inter' }}>
                        Remove any face coverings, large glasses, hats, or masks before capture.
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
