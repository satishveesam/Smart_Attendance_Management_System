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
  CameraAlt as CameraIcon,
  MyLocation as GpsIcon,
  QrCodeScanner as QrIcon,
  CheckCircle as SuccessIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

const EmployeeAttendance = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [attendanceType, setAttendanceType] = useState('gps'); // 'gps' or 'qr'
  const [qrToken, setQrToken] = useState('');
  const [gps, setGps] = useState({ latitude: null, longitude: null, error: null });

  // Geofence & Timer states
  const [distanceToOffice, setDistanceToOffice] = useState(null);
  const [isInGeofence, setIsInGeofence] = useState(false);
  const [simulateLocation, setSimulateLocation] = useState(false);
  const [elapsedHours, setElapsedHours] = useState('00:00:00');

  // Camera & Biometrics state
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);
  const [faceStatus, setFaceStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'failed'

  const [todayLog, setTodayLog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Calculate distance to HITEC City office coordinates (17.4483, 78.3741)
  useEffect(() => {
    if (simulateLocation) {
      setDistanceToOffice(0);
      setIsInGeofence(true);
    } else if (gps.latitude && gps.longitude) {
      const R = 6371e3; // meters
      const lat1 = gps.latitude * Math.PI / 180;
      const lat2 = 17.4483 * Math.PI / 180;
      const deltaLat = (17.4483 - gps.latitude) * Math.PI / 180;
      const deltaLon = (78.3741 - gps.longitude) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      setDistanceToOffice(distance);
      setIsInGeofence(distance <= 200);
    } else {
      setDistanceToOffice(null);
      setIsInGeofence(false);
    }
  }, [gps.latitude, gps.longitude, simulateLocation]);

  // Live Timer for Checked-In hours
  useEffect(() => {
    let interval = null;
    if (todayLog && todayLog.checkIn && !todayLog.checkOut) {
      const checkInTime = new Date(todayLog.checkIn).getTime();
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
      const todayStr = new Date().toISOString().split('T')[0];
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
      
      // 2. Local biometric matching
      if (registeredDescriptor) {
        let sum = 0;
        for (let i = 0; i < descriptor.length; i++) {
          const diff = descriptor[i] - registeredDescriptor[i];
          sum += diff * diff;
        }
        const distance = Math.sqrt(sum);
        if (distance > 0.6) {
          setFaceStatus('failed');
          setApiError('Face does not match registered profile. Verification failed.');
          setSubmitting(false);
          return;
        }
      }

      setFaceDescriptor(descriptor);
      setFaceStatus('success');

      // 3. Submit check-in or check-out to backend
      const isCheckOut = todayLog && !todayLog.checkOut;
      const endpoint = isCheckOut ? '/attendance/checkout' : '/attendance/checkin';
      const payload = {
        latitude: gps.latitude,
        longitude: gps.longitude,
        qrToken: (!isCheckOut && attendanceType === 'qr') ? qrToken : null,
        faceDescriptor: JSON.stringify(descriptor),
        selfie: screenshot,
        address: 'C9WH+W92, HUDA Techno Enclave, HITEC City, Hyderabad',
      };

      const res = await API.post(endpoint, payload);
      
      if (isCheckOut) {
        setApiSuccess(`Successfully checked out at ${new Date(res.data.checkOut).toLocaleTimeString()}`);
      } else {
        setApiSuccess(`Successfully checked in today at ${new Date(res.data.checkIn).toLocaleTimeString()}`);
      }
      setTodayLog(res.data);
      
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

  return (
    <EmployeeLayout>
      <Box className="fade-in" sx={{ pb: { xs: 2, md: 4 } }}>
        
        {/* Page Header */}
        <Box sx={{ mb: { xs: 2.5, md: 3.5 } }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: { xs: '1.4rem', md: '2rem' }, fontFamily: 'Outfit' }}>
            Mark Attendance
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '12px', md: '13.5px' }, mt: 0.3, fontFamily: 'Inter' }}>
            Facial biometrics & geofencing validation kiosk
          </Typography>
        </Box>

        {/* Global Notifications */}
        {apiSuccess && (
          <Alert severity="success" sx={{ mb: 2, py: 0.5, borderRadius: 2, fontSize: '12px' }} icon={<SuccessIcon sx={{ fontSize: 18 }} />}>
            {apiSuccess}
          </Alert>
        )}

        {apiError && (
          <Alert severity="error" sx={{ mb: 2, py: 0.5, borderRadius: 2, fontSize: '12px' }}>
            {apiError}
          </Alert>
        )}

        <Grid container spacing={2}>
          
          {/* CAMERA SCANNER PANEL */}
          <Grid item xs={12} md={7}>
            {(!todayLog || (todayLog && !todayLog.checkOut)) ? (
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography sx={{ fontWeight: 'bold', mb: 1.5, color: '#1e293b', fontSize: '13px', fontFamily: 'Outfit' }}>
                    1. Biometric Scan Terminal
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Camera view container with target square framing */}
                    <Box sx={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4/3',
                      borderRadius: 2.5,
                      overflow: 'hidden',
                      border: '2px solid #e2e8f0',
                      bgcolor: '#0f172a',
                      mb: 2,
                    }}>
                      {imgSrc ? (
                        <Box
                          component="img"
                          src={imgSrc}
                          alt="Captured Frame"
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}

                      {/* Align Face target frame overlay */}
                      {!imgSrc && (
                        <Box sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: { xs: '65%', md: '55%' },
                          height: { xs: '65%', md: '55%' },
                          border: '2px dashed rgba(16, 185, 129, 0.4)',
                          borderRadius: '12px',
                          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.35)',
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
                          <Typography sx={{ color: '#10b981', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
                            Align Face
                          </Typography>
                        </Box>
                      )}

                      {/* HUD status badges on top of webcam */}
                      <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1, zIndex: 10 }}>
                        <Chip
                          label={isInGeofence ? 'Geofence: IN' : 'Geofence: OUT'}
                          color={isInGeofence ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 'bold', height: 20, fontSize: '9px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        />
                      </Box>

                      {/* Scanning / Processing overlays */}
                      {faceStatus === 'scanning' && (
                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(15,23,42,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                          <CircularProgress size={28} sx={{ color: '#10b981', mb: 1 }} />
                          <Typography sx={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', fontFamily: 'Inter' }}>
                            Analyzing biometrics...
                          </Typography>
                        </Box>
                      )}

                      {faceStatus === 'success' && (
                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(16,185,129,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                          <SuccessIcon sx={{ color: '#fff', fontSize: 45, mb: 1 }} />
                          <Typography sx={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', fontFamily: 'Outfit' }}>
                            Face Verified Successfully!
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Integrated Action Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={submitting}
                      onClick={handleVerifyAndSubmit}
                      sx={{
                        py: 1.2,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 'bold',
                        fontSize: '12.5px',
                        backgroundColor: (todayLog && !todayLog.checkOut) ? '#f59e0b' : '#10b981',
                        '&:hover': { backgroundColor: (todayLog && !todayLog.checkOut) ? '#d97706' : '#059669' },
                        boxShadow: 'none'
                      }}
                    >
                      {submitting ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (todayLog && !todayLog.checkOut) ? (
                        'Scan & Confirm Check-Out'
                      ) : (
                        'Scan & Confirm Check-In'
                      )}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 4, textAlign: 'center', bgcolor: '#fff', boxShadow: 'none' }}>
                <SuccessIcon color="success" sx={{ fontSize: 50, mb: 1 }} />
                <Typography sx={{ fontWeight: 'bold', color: '#1e293b', mb: 0.5, fontSize: '14px', fontFamily: 'Outfit' }}>
                  Biometric Terminal Blocked
                </Typography>
                <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'Inter' }}>
                  Your shift logs are completed for today. Webcam scanning is disabled.
                </Typography>
              </Card>
            )}
          </Grid>

          {/* VERIFICATION & DETAILS PANEL */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography sx={{ fontWeight: 'bold', mb: 1.5, color: '#1e293b', fontSize: '13px', fontFamily: 'Outfit' }}>
                  2. Verification Context
                </Typography>
                <Divider sx={{ mb: 1.5 }} />

                {!registeredDescriptor && (
                  <Alert severity="warning" sx={{ mb: 2, py: 0.5, fontSize: '11px', borderRadius: 2 }} action={
                    <Button color="inherit" size="small" onClick={() => navigate('/employee/profile')} sx={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'none' }}>
                      Register
                    </Button>
                  }>
                    Biometrics not registered.
                  </Alert>
                )}

                {/* Active Timer for Checked-In */}
                {todayLog && !todayLog.checkOut && (
                  <Box sx={{ mb: 2, p: 1.5, borderRadius: 2.5, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                    <Typography sx={{ color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '9px', display: 'block' }}>
                      ⏱️ Active Shift Timer
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', color: '#1e3a8a', my: 0.5, fontSize: '20px', fontFamily: 'Outfit' }}>
                      {elapsedHours}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '9.5px', fontFamily: 'Inter' }}>
                      Checked in at: {todayLog.checkIn ? new Date(todayLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </Typography>
                  </Box>
                )}

                {/* Shift Details Info Card */}
                <Box sx={{ mb: 2, p: 1.5, borderRadius: 2.5, bgcolor: '#fff8e1', border: '1px solid #ffe082' }}>
                  <Typography sx={{ fontWeight: 'bold', color: '#b78103', mb: 0.5, fontSize: '11.5px', fontFamily: 'Outfit' }}>
                    📅 Shift: General Corporate Shift
                  </Typography>
                  <Typography sx={{ color: '#5d4037', display: 'block', fontSize: '10px', fontFamily: 'Inter' }}>
                    Timings: <strong>10:00 AM - 06:30 PM</strong>
                  </Typography>
                  <Typography sx={{ color: '#5d4037', fontSize: '10px', fontFamily: 'Inter' }}>
                    Grace Period: 15 mins (Late marking active after 10:15 AM).
                  </Typography>
                </Box>

                {/* GPS Tracking status */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1.2, borderRadius: 2.5, border: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                  <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: gps.error ? '#fef2f2' : '#ecfdf5', mr: 1.5, display: 'flex', alignItems: 'center' }}>
                    <GpsIcon color={gps.error ? 'error' : 'success'} sx={{ fontSize: 16 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 'bold', color: '#475569', fontSize: '11.5px' }}>
                      GPS Tracking Status
                    </Typography>
                    {gps.error ? (
                      <Typography color="error" sx={{ fontSize: '9.5px', display: 'block' }}>{gps.error}</Typography>
                    ) : gps.latitude ? (
                      <Typography color="text.secondary" sx={{ fontSize: '9.5px', display: 'block' }}>
                        Coords: {gps.latitude.toFixed(4)}, {gps.longitude.toFixed(4)}
                      </Typography>
                    ) : (
                      <Typography color="text.secondary" sx={{ fontSize: '9.5px', display: 'block' }}>Acquiring coordinates...</Typography>
                    )}
                  </Box>
                  <Button size="small" onClick={fetchLocation} sx={{ textTransform: 'none', fontSize: '9.5px', fontWeight: 'bold' }}>
                    Reload
                  </Button>
                </Box>

                {/* Geofence boundary check */}
                {gps.latitude && (
                  <Box sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: isInGeofence ? '#f0fdf4' : '#fef2f2',
                    border: `1px dashed ${isInGeofence ? '#bbf7d0' : '#fecaca'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 'bold', color: isInGeofence ? '#166534' : '#991b1b', fontSize: '11.5px', fontFamily: 'Outfit' }}>
                        🎯 Geofence Zone
                      </Typography>
                      <Chip
                        label={isInGeofence ? 'IN ZONE' : 'OUT OF ZONE'}
                        color={isInGeofence ? 'success' : 'error'}
                        size="small"
                        sx={{ height: 18, fontSize: '8.5px', fontWeight: 'bold' }}
                      />
                    </Box>
                    <Typography sx={{ color: '#475569', fontSize: '10px' }}>
                      Distance to Office: <strong>{distanceToOffice !== null ? `${distanceToOffice.toFixed(1)} meters` : 'Calculating...'}</strong>
                    </Typography>
                    
                    {/* Simulated location checkbox */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <input
                        type="checkbox"
                        id="sim-loc-check"
                        checked={simulateLocation}
                        onChange={(e) => setSimulateLocation(e.target.checked)}
                        style={{ marginRight: '6px', cursor: 'pointer', transform: 'scale(0.9)' }}
                      />
                      <label htmlFor="sim-loc-check" style={{ fontSize: '9px', color: '#0284c7', fontWeight: 'bold', cursor: 'pointer' }}>
                        Simulate Location (Inside Range)
                      </label>
                    </Box>
                  </Box>
                )}

                {/* Method selection */}
                {!todayLog && (
                  <FormControl component="fieldset" sx={{ mb: 2, display: 'block' }}>
                    <FormLabel component="legend" sx={{ fontSize: 11, fontWeight: 'bold', mb: 0.5, color: '#475569' }}>
                      Check-In Method
                    </FormLabel>
                    <RadioGroup
                      row
                      value={attendanceType}
                      onChange={(e) => setAttendanceType(e.target.value)}
                    >
                      <FormControlLabel value="gps" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '11px' }}>GPS only</Typography>} />
                      <FormControlLabel value="qr" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '11px' }}>QR Code scan</Typography>} />
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
                    sx={{ mb: 2 }}
                    inputProps={{ style: { fontSize: 11.5 } }}
                    InputLabelProps={{ style: { fontSize: 11.5 } }}
                    InputProps={{
                      startAdornment: <QrIcon sx={{ mr: 1, color: '#64748b', fontSize: 16 }} />,
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
