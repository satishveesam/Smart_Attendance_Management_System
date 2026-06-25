import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import EmployeeLayout from '../layouts/EmployeeLayout';
import API from '../api';
import { getFaceDescriptor } from '../services/faceApi';
import Webcam from 'react-webcam';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
} from '@mui/material';
import {
  MyLocation as GpsIcon,
  QrCodeScanner as QrIcon,
  CheckCircle as SuccessIcon,
  AccessTime as TimeIcon,
  Fingerprint as FingerprintIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

const EmployeeAttendance = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [attendanceType, setAttendanceType] = useState('gps'); // 'gps' or 'qr'
  const [employeeProfile, setEmployeeProfile] = useState(null);

  const fetchEmployeeProfile = async () => {
    try {
      const res = await API.get('/employees/me');
      setEmployeeProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch employee profile: ", err);
    }
  };

  const getShiftTimings = () => {
    const shiftStr = employeeProfile?.assignedShift || 'General Shift (10:00 AM - 06:30 PM)';
    const match = shiftStr.match(/\(([^)]+)\)/);
    return match ? match[1] : "10:00 AM - 06:30 PM";
  };

  const getShiftEndHourAndMinute = () => {
    const range = getShiftTimings();
    const parts = range.split(' - ');
    if (parts.length < 2) return { hour: 18, minute: 30 };
    const endStr = parts[1].trim();
    const timeParts = endStr.split(' ');
    if (timeParts.length < 2) return { hour: 18, minute: 30 };
    const hm = timeParts[0].split(':');
    let hour = parseInt(hm[0], 10);
    const minute = hm.length > 1 ? parseInt(hm[1], 10) : 0;
    const ampm = timeParts[1].toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
  };

  const getLateMarkingTimeString = () => {
    const range = getShiftTimings();
    const startStr = range.split(' - ')[0].trim();
    const parts = startStr.split(' ');
    if (parts.length < 2) return "10:15 AM";
    const hm = parts[0].split(':');
    let h = parseInt(hm[0], 10);
    let m = parseInt(hm[1], 10) + 15;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
    const ampm = parts[1];
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  const [qrToken, setQrToken] = useState('');
  const [gps, setGps] = useState({ latitude: null, longitude: null, error: null });

  // Geofence & Timer states
  const [distanceToOffice, setDistanceToOffice] = useState(null);
  const [isInGeofence, setIsInGeofence] = useState(false);
  const [simulateLocation, setSimulateLocation] = useState(false);
  const [elapsedHours, setElapsedHours] = useState('00:00:00');
  const [officeCoordinates, setOfficeCoordinates] = useState({ latitude: 17.4483, longitude: 78.3741, radius: 200 });

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null;
    const parts = dateTimeStr.split(/[T ]/);
    if (parts.length < 2) return new Date(dateTimeStr);
    const dateParts = parts[0].split('-');
    const timeParts = parts[1].split(':');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
    const day = parseInt(dateParts[2], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = timeParts.length > 2 ? parseInt(timeParts[2].split('.')[0], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
  };

  // Camera & Biometrics state
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);
  const [faceStatus, setFaceStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'failed'
  const [allowReCheckIn, setAllowReCheckIn] = useState(false);

  const [todayLog, setTodayLog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Fetch office location dynamically
  const fetchOfficeLocation = async () => {
    try {
      const res = await API.get('/attendance/office-location');
      if (res.data && res.data.latitude && res.data.longitude) {
        setOfficeCoordinates({
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          radius: res.data.radiusMeters || 200
        });
      }
    } catch (err) {
      console.error("Failed to fetch office location from backend: ", err);
    }
  };

  // Calculate distance to office coordinates
  useEffect(() => {
    if (simulateLocation) {
      setDistanceToOffice(0);
      setIsInGeofence(true);
    } else if (gps.latitude && gps.longitude) {
      const R = 6371e3; // meters
      const lat1 = gps.latitude * Math.PI / 180;
      const lat2 = officeCoordinates.latitude * Math.PI / 180;
      const deltaLat = (officeCoordinates.latitude - gps.latitude) * Math.PI / 180;
      const deltaLon = (officeCoordinates.longitude - gps.longitude) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      setDistanceToOffice(distance);
      setIsInGeofence(distance <= officeCoordinates.radius);
    } else {
      setDistanceToOffice(null);
      setIsInGeofence(false);
    }
  }, [gps.latitude, gps.longitude, simulateLocation, officeCoordinates]);

  // Live Timer for Checked-In hours
  useEffect(() => {
    let interval = null;
    if (todayLog && todayLog.checkIn && !todayLog.checkOut) {
      const checkInTime = parseLocalDateTime(todayLog.checkIn).getTime();
      interval = setInterval(() => {
        const diff = Date.now() - checkInTime;
        if (diff > 0) {
          const secs = Math.floor((diff / 1000) % 60);
          const mins = Math.floor((diff / (1000 * 60)) % 60);
          const hrs = Math.floor((diff / (1000 * 60 * 60)));
          setElapsedHours(
            `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
          );
        }
      }, 1000);
    } else {
      setElapsedHours('00:00:00');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [todayLog]);

  useEffect(() => {
    fetchTodayStatus();
    fetchLocation();
    fetchRegisteredFace();
    fetchOfficeLocation();
    fetchEmployeeProfile();
  }, []);

  const fetchRegisteredFace = async () => {
    try {
      const res = await API.get('/face/descriptor');
      if (res.data && res.data.faceDescriptor) {
        setRegisteredDescriptor(JSON.parse(res.data.faceDescriptor));
      }
    } catch (err) {
      console.warn("No registered face descriptor found or failed to fetch: ", err);
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const res = await API.get('/attendance/history');
      const todayStr = getLocalDateString();
      const todayRecord = res.data.find((r) => r.attendanceDate === todayStr);
      setTodayLog(todayRecord || null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLocation = () => {
    setGps((prev) => ({ ...prev, error: null }));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGps({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            error: null,
          });
        },
        (err) => {
          console.error(err);
          setGps({
            latitude: null,
            longitude: null,
            error: 'GPS Access denied. Please enable location permissions in your browser.',
          });
        },
        { enableHighAccuracy: true }
      );
    } else {
      setGps({
        latitude: null,
        longitude: null,
        error: 'Geolocation is not supported by your browser.',
      });
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (!webcamRef.current) return;
    
    // Preliminary validation
    if (gps.error || !gps.latitude) {
      setApiError('Valid GPS coordinates are required to verify geofence.');
      return;
    }
    if (!isInGeofence) {
      setApiError('You are outside the permitted office geofence range.');
      return;
    }
    if (attendanceType === 'qr' && !qrToken) {
      setApiError('QR Code token is required for QR attendance verification.');
      return;
    }

    setFaceStatus('scanning');
    setApiError('');
    setApiSuccess('');
    setSubmitting(true);

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      setFaceStatus('failed');
      setApiError('Failed to capture frame from webcam.');
      setSubmitting(false);
      return;
    }

    setImgSrc(screenshot);

    try {
      // 1. Get face descriptor
      const descriptor = await getFaceDescriptor(screenshot);
      if (!descriptor) {
        setFaceStatus('failed');
        setApiError('No face detected in the captured selfie. Please align your face clearly in the camera frame.');
        setSubmitting(false);
        return;
      }
      
      // 2. Enforce registered biometric profile and 128 face points
      if (!descriptor || descriptor.length !== 128) {
        setFaceStatus('failed');
        setApiError('Invalid face scan. Face descriptor must contain exactly 128 points.');
        setSubmitting(false);
        return;
      }
      if (!registeredDescriptor || registeredDescriptor.length !== 128) {
        setFaceStatus('failed');
        setApiError('No valid registered 128-point face signature found. Please register your face profile in your settings first.');
        setSubmitting(false);
        return;
      }

      // 3. Local biometric matching with secure 0.5 threshold
      let sum = 0;
      for (let i = 0; i < descriptor.length; i++) {
        const diff = descriptor[i] - registeredDescriptor[i];
        sum += diff * diff;
      }
      const distance = Math.sqrt(sum);
      if (distance > 0.5) {
        setFaceStatus('failed');
        setApiError(`Face does not match registered profile. Verification failed (Confidence distance: ${distance.toFixed(3)}, allowed limit: 0.500).`);
        setSubmitting(false);
        return;
      }

      setFaceDescriptor(descriptor);
      setFaceStatus('success');

      // 4. Submit check-in or check-out to backend
      const isCheckOut = todayLog && !todayLog.checkOut;
      const endpoint = isCheckOut ? '/attendance/checkout' : '/attendance/checkin';

      // Compute actual physical distance before sending (independent of simulation mode)
      let actualDistanceMeters = null;
      if (gps.latitude && gps.longitude) {
        const R = 6371e3; // meters
        const lat1 = gps.latitude * Math.PI / 180;
        const lat2 = officeCoordinates.latitude * Math.PI / 180;
        const deltaLat = (officeCoordinates.latitude - gps.latitude) * Math.PI / 180;
        const deltaLon = (officeCoordinates.longitude - gps.longitude) * Math.PI / 180;
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        actualDistanceMeters = R * c;
      }

      const payload = {
        // Send simulated office coordinates to backend if simulation is active
        latitude: simulateLocation ? officeCoordinates.latitude : gps.latitude,
        longitude: simulateLocation ? officeCoordinates.longitude : gps.longitude,
        qrToken: (!isCheckOut && attendanceType === 'qr') ? qrToken : null,
        faceDescriptor: JSON.stringify(descriptor),
        selfie: screenshot,          // Handled by CheckOutRequest DTO
        selfieBase64: screenshot,    // Handled by CheckInRequest DTO
        address: 'C9WH+W92, HUDA Techno Enclave, HITEC City, Hyderabad',
        locationSimulated: simulateLocation,
        actualDistance: actualDistanceMeters
      };

      const res = await API.post(endpoint, payload);
      
      if (isCheckOut) {
        setApiSuccess(`Successfully checked out at ${new Date(res.data.checkOut).toLocaleTimeString()}`);
      } else {
        setApiSuccess(`Successfully checked in today at ${new Date(res.data.checkIn).toLocaleTimeString()}`);
      }
      setTodayLog(res.data);
      setAllowReCheckIn(false);
      
      // Clear visual feedback after 3 seconds
      setTimeout(() => {
        setImgSrc(null);
        setFaceDescriptor(null);
        setFaceStatus('idle');
      }, 3000);

    } catch (err) {
      console.error(err);
      setFaceStatus('failed');
      setApiError(err.response?.data?.message || err.message || 'Verification or API submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const nowTime = new Date();
  const shiftEnd = getShiftEndHourAndMinute();
  const isAfterShiftEnd = nowTime.getHours() > shiftEnd.hour || (nowTime.getHours() === shiftEnd.hour && nowTime.getMinutes() >= shiftEnd.minute);
  const showScanner = (todayLog && !todayLog.checkOut) || (!isAfterShiftEnd && (!todayLog || allowReCheckIn));

  return (
    <EmployeeLayout>
      <Box className="fade-in" sx={{ pb: { xs: 3, md: 5 } }}>
        
        {/* 1. Sleek Outside Header Banner */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3.5 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 42, md: 50 },
            height: { xs: 42, md: 50 },
            borderRadius: 3,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
          }}>
            <FingerprintIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.4rem', md: '1.85rem' }, fontFamily: 'Outfit', letterSpacing: '-0.5px' }}>
              Mark Attendance
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '12px', md: '13px' }, mt: 0.2, fontFamily: 'Inter' }}>
              Verify facial biometrics and geofence coordinates to log your shift
            </Typography>
          </Box>
        </Box>

        {/* Global Notifications */}
        {apiSuccess && (
          <Alert severity="success" sx={{ mb: 3, py: 0.8, px: 2, borderRadius: 3, fontSize: '12.5px', fontFamily: 'Inter', fontWeight: 500 }} icon={<SuccessIcon sx={{ fontSize: 20 }} />}>
            {apiSuccess}
          </Alert>
        )}

        {apiError && (
          <Alert severity="error" sx={{ mb: 3, py: 0.8, px: 2, borderRadius: 3, fontSize: '12.5px', fontFamily: 'Inter', fontWeight: 500 }}>
            {apiError}
          </Alert>
        )}

        <Grid container spacing={3}>
          
          {/* CAMERA SCANNER PANEL */}
          <Grid item xs={12} md={7}>
            {showScanner ? (
              <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)', bgcolor: '#fff', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontWeight: 'bold', mb: 2, color: '#0f172a', fontSize: '14px', fontFamily: 'Outfit' }}>
                    1. Biometric Scanner Terminal
                  </Typography>
                  <Divider sx={{ mb: 2.5, borderColor: '#f1f5f9' }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Camera view container with target square framing */}
                    <Box sx={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4/3',
                      borderRadius: 3.5,
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      bgcolor: '#0f172a',
                      mb: 2.5,
                    }}>
                      {imgSrc ? (
                        <Box
                          component="img"
                          src={imgSrc}
                          alt="Captured Frame"
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
                      {!imgSrc && (
                        <Box sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: { xs: '68%', md: '58%' },
                          height: { xs: '68%', md: '58%' },
                          border: '2px dashed rgba(16, 185, 129, 0.4)',
                          borderRadius: '16px',
                          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.4)',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <span style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
                            <span style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderLeft: '4px solid #10b981', borderTop: '4px solid #10b981', borderTopLeftRadius: '8px' }} />
                            <span style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRight: '4px solid #10b981', borderTop: '4px solid #10b981', borderTopRightRadius: '8px' }} />
                            <span style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderLeft: '4px solid #10b981', borderBottom: '4px solid #10b981', borderBottomLeftRadius: '8px' }} />
                            <span style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRight: '4px solid #10b981', borderBottom: '4px solid #10b981', borderBottomRightRadius: '8px' }} />
                          </span>
                          <Typography sx={{ color: '#10b981', fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', opacity: 0.85, fontFamily: 'Outfit' }}>
                            Align Face
                          </Typography>
                        </Box>
                      )}

                      {/* HUD status badges on top of webcam */}
                      <Box sx={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 1, zIndex: 10 }}>
                        <Chip
                          label={isInGeofence ? 'Geofence: IN ZONE' : 'Geofence: OUT OF ZONE'}
                          color={isInGeofence ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 'bold', height: 22, fontSize: '9.5px', fontFamily: 'Outfit', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                        />
                      </Box>

                      {/* Scanning / Processing overlays */}
                      {faceStatus === 'scanning' && (
                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(15,23,42,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                          <CircularProgress size={30} sx={{ color: '#10b981', mb: 1.5 }} />
                          <Typography sx={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', fontFamily: 'Inter' }}>
                            Analyzing biometrics...
                          </Typography>
                        </Box>
                      )}

                      {faceStatus === 'success' && (
                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(16,185,129,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                          <SuccessIcon sx={{ color: '#fff', fontSize: 50, mb: 1.5 }} />
                          <Typography sx={{ color: '#fff', fontSize: '14.5px', fontWeight: 800, fontFamily: 'Outfit' }}>
                            Biometrics Matching Success!
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Integrated Action Button */}
                    {faceStatus === 'failed' ? (
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        onClick={() => {
                          setImgSrc(null);
                          setFaceDescriptor(null);
                          setFaceStatus('idle');
                          setApiError('');
                        }}
                        sx={{
                          py: 1.5,
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          fontFamily: 'Outfit',
                          boxShadow: 'none',
                          '&:hover': {
                            backgroundColor: '#dc2626'
                          }
                        }}
                      >
                        🔄 Retake Selfie / Try Again
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        disabled={submitting}
                        onClick={handleVerifyAndSubmit}
                        sx={{
                          py: 1.5,
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          fontFamily: 'Outfit',
                          backgroundColor: (todayLog && !todayLog.checkOut) ? '#f59e0b' : '#10b981',
                          '&:hover': { backgroundColor: (todayLog && !todayLog.checkOut) ? '#d97706' : '#059669' },
                          boxShadow: 'none',
                          '&:disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8' }
                        }}
                      >
                        {submitting ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (todayLog && !todayLog.checkOut) ? (
                          'Verify & Confirm Check-Out'
                        ) : (
                          'Verify & Confirm Check-In'
                        )}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', p: 5, textAlign: 'center', bgcolor: '#fff', boxShadow: 'none' }}>
                {todayLog && todayLog.checkIn && todayLog.checkOut ? (
                  <>
                    <SuccessIcon color="success" sx={{ fontSize: 56, mb: 2 }} />
                    <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '15px', fontFamily: 'Outfit' }}>
                      Shift Completed Successfully
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter', maxWidth: 380, mx: 'auto', lineHeight: 1.5, mb: 3 }}>
                      Your check-in and check-out logs are recorded for today.
                    </Typography>
                    {!isAfterShiftEnd && (
                      <Button
                        variant="contained"
                        onClick={() => setAllowReCheckIn(true)}
                        sx={{
                          py: 1.2,
                          px: 4,
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontWeight: 'bold',
                          fontFamily: 'Outfit',
                          backgroundColor: '#10b981',
                          '&:hover': { backgroundColor: '#059669' },
                          boxShadow: 'none',
                        }}
                      >
                        🔄 Check-In Again (Start New Session)
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Box sx={{ p: 2, borderRadius: '50%', bgcolor: '#fef2f2', color: '#ef4444', display: 'flex' }}>
                        <TimeIcon sx={{ fontSize: 36 }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '15px', fontFamily: 'Outfit' }}>
                      Check-In Closed
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter', maxWidth: 360, mx: 'auto', lineHeight: 1.5 }}>
                      Today's shift time has ended ({getShiftTimings().split(' - ')[1] || '6:30 PM'}). Biometric check-in is locked until your next shift.
                    </Typography>
                  </>
                )}
              </Card>
            )}
          </Grid>

          {/* VERIFICATION & DETAILS PANEL */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)', bgcolor: '#fff', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 'bold', mb: 2, color: '#0f172a', fontSize: '14px', fontFamily: 'Outfit' }}>
                  2. Verification Parameters
                </Typography>
                <Divider sx={{ mb: 2.5, borderColor: '#f1f5f9' }} />

                {!registeredDescriptor && (
                  <Alert severity="warning" sx={{ mb: 2.5, py: 0.5, fontSize: '11.5px', borderRadius: 2.5, fontFamily: 'Inter' }} action={
                    <Button color="inherit" size="small" onClick={() => navigate('/employee/profile')} sx={{ fontWeight: 800, fontSize: '10px', textTransform: 'none', fontFamily: 'Outfit' }}>
                      Register Now
                    </Button>
                  }>
                    Biometrics not registered.
                  </Alert>
                )}

                {/* Active Timer for Checked-In */}
                {todayLog && !todayLog.checkOut && (
                  <Box sx={{ mb: 2.5, p: 2, borderRadius: 3.5, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                    <Typography sx={{ color: '#1e40af', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '9px', display: 'block', fontFamily: 'Inter' }}>
                      ⏱️ Active Shift Timer
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: '#1e3a8a', my: 0.6, fontSize: '22px', fontFamily: 'Outfit' }}>
                      {elapsedHours}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '10px', fontFamily: 'Inter' }}>
                      Checked in at: <strong>{todayLog.checkIn ? new Date(todayLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</strong>
                    </Typography>
                  </Box>
                )}

                {/* Shift Details Info Card */}
                <Box sx={{ mb: 2.5, p: 2, borderRadius: 3.5, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
                  <Typography sx={{ fontWeight: 'bold', color: '#b45309', mb: 0.8, fontSize: '12px', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 16 }} /> {employeeProfile?.assignedShift ? employeeProfile.assignedShift.split(' (')[0] : 'General Corporate Shift'}
                  </Typography>
                  <Typography sx={{ color: '#78350f', display: 'block', fontSize: '10.5px', fontFamily: 'Inter', lineHeight: 1.4 }}>
                    Shift Timings: <strong>{getShiftTimings()}</strong>
                  </Typography>
                  <Typography sx={{ color: '#78350f', fontSize: '10.5px', fontFamily: 'Inter', mt: 0.3, lineHeight: 1.4 }}>
                    Grace Period: 15 mins (Late marking active after {getLateMarkingTimeString()}).
                  </Typography>
                </Box>

                {/* GPS Tracking status */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, p: 1.8, borderRadius: 3, border: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                  <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: gps.error ? '#fef2f2' : '#ecfdf5', mr: 2, display: 'flex', alignItems: 'center' }}>
                    <GpsIcon color={gps.error ? 'error' : 'success'} sx={{ fontSize: 18 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 800, color: '#334155', fontSize: '12px', fontFamily: 'Outfit' }}>
                      GPS Tracking Status
                    </Typography>
                    {gps.error ? (
                      <Typography color="error" sx={{ fontSize: '10px', display: 'block', fontFamily: 'Inter', mt: 0.2 }}>{gps.error}</Typography>
                    ) : gps.latitude ? (
                      <Typography color="text.secondary" sx={{ fontSize: '10px', display: 'block', fontFamily: 'Inter', mt: 0.2 }}>
                        Coords: {gps.latitude.toFixed(4)}, {gps.longitude.toFixed(4)}
                      </Typography>
                    ) : (
                      <Typography color="text.secondary" sx={{ fontSize: '10px', display: 'block', fontFamily: 'Inter', mt: 0.2 }}>Acquiring satellite coordinates...</Typography>
                    )}
                  </Box>
                  <Button size="small" onClick={fetchLocation} sx={{ textTransform: 'none', fontSize: '10px', fontWeight: 'bold', fontFamily: 'Outfit' }}>
                    Reload
                  </Button>
                </Box>

                {/* Geofence boundary check */}
                {gps.latitude && (
                  <Box sx={{
                    mb: 2.5,
                    p: 2,
                    borderRadius: 3.5,
                    bgcolor: isInGeofence ? '#ecfdf5' : '#fef2f2',
                    border: `1px dashed ${isInGeofence ? '#a7f3d0' : '#fca5a5'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 'bold', color: isInGeofence ? '#065f46' : '#991b1b', fontSize: '12px', fontFamily: 'Outfit' }}>
                        🎯 Geofence Zone
                      </Typography>
                      <Chip
                        label={isInGeofence ? 'IN RANGE' : 'OUT OF RANGE'}
                        color={isInGeofence ? 'success' : 'error'}
                        size="small"
                        sx={{ height: 20, fontSize: '9px', fontWeight: 800, fontFamily: 'Outfit' }}
                      />
                    </Box>
                    <Typography sx={{ color: '#475569', fontSize: '10.5px', fontFamily: 'Inter' }}>
                      Distance to Office: <strong>{distanceToOffice !== null ? `${distanceToOffice.toFixed(1)} meters` : 'Calculating...'}</strong>
                    </Typography>
                    
                    {/* Simulated location checkbox */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.8 }}>
                      <input
                        type="checkbox"
                        id="sim-loc-check"
                        checked={simulateLocation}
                        onChange={(e) => setSimulateLocation(e.target.checked)}
                        style={{ marginRight: '8px', cursor: 'pointer', transform: 'scale(1.05)' }}
                      />
                      <label htmlFor="sim-loc-check" style={{ fontSize: '10px', color: '#0284c7', fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit' }}>
                        Simulate Location (Force Inside Office Geofence)
                      </label>
                    </Box>
                  </Box>
                )}

                {/* Method selection */}
                {!todayLog && (
                  <FormControl component="fieldset" sx={{ mb: 2.5, display: 'block' }}>
                    <FormLabel component="legend" sx={{ fontSize: 11.5, fontWeight: 'bold', mb: 0.8, color: '#475569', fontFamily: 'Outfit' }}>
                      Verification Payout Method
                    </FormLabel>
                    <RadioGroup
                      row
                      value={attendanceType}
                      onChange={(e) => setAttendanceType(e.target.value)}
                    >
                      <FormControlLabel value="gps" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '11.5px', fontFamily: 'Inter' }}>GPS verification only</Typography>} />
                      <FormControlLabel value="qr" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '11.5px', fontFamily: 'Inter' }}>QR scanner token</Typography>} />
                    </RadioGroup>
                  </FormControl>
                )}

                {attendanceType === 'qr' && !todayLog && (
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label="Enter QR Code Token"
                    value={qrToken}
                    onChange={(e) => setQrToken(e.target.value)}
                    sx={{ mb: 2.5 }}
                    inputProps={{ style: { fontSize: 12, fontFamily: 'Inter' } }}
                    InputLabelProps={{ style: { fontSize: 12, fontFamily: 'Inter' } }}
                    InputProps={{
                      startAdornment: <QrIcon sx={{ mr: 1.5, color: '#64748b', fontSize: 18 }} />,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
          
        </Grid>
      </Box>
    </EmployeeLayout>
  );
};

export default EmployeeAttendance;
