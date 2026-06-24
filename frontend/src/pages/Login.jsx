import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure, clearError } from '../redux/authSlice';
import API from '../api';
import GuestLayout from '../layouts/GuestLayout';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Lock as LockIcon, 
  AccountCircle as AccountIcon,
  Fingerprint as CheckInIcon,
  VerifiedUser as ShieldIcon,
  MyLocation as LocationIcon,
  Timeline as AuditIcon,
} from '@mui/icons-material';

const Login = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Clear Redux errors on load
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ROLE_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    dispatch(loginStart());

    try {
      const response = await API.post('/auth/login', { usernameOrEmail, password });
      dispatch(loginSuccess(response.data));
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || 'Invalid username or password';
      dispatch(loginFailure(message));
      setApiError(message);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%',
      overflowX: 'hidden',
      display: 'flex', 
      bgcolor: '#f8fafc',
      fontFamily: 'Inter'
    }}>
      <Grid container sx={{ width: '100%', m: 0 }}>
        
        {/* Left Side: Product Branding / Features Info (hidden on mobile) */}
        <Grid 
          item 
          xs={false} 
          sm={5} 
          md={6} 
          lg={7}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: { sm: 4, md: 6, lg: 8 },
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            position: 'relative',
            overflow: 'hidden',
            color: '#fff'
          }}
        >
          {/* Subtle glowing ambient circles */}
          <Box sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%)',
            top: -50,
            left: -50,
          }} />
          <Box sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0) 70%)',
            bottom: -100,
            right: -100,
          }} />

          {/* Product Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, mb: 6, zIndex: 2 }}>
            <Box sx={{ 
              p: 1, 
              borderRadius: 3, 
              bgcolor: 'rgba(16, 185, 129, 0.15)', 
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <CheckInIcon sx={{ color: '#10b981', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', letterSpacing: '0.5px' }}>
              SmartAttendance
            </Typography>
          </Box>

          {/* Slogan */}
          <Box sx={{ mb: 6, zIndex: 2, maxWidth: 480 }}>
            <Typography sx={{ 
              fontSize: { sm: '22px', md: '28px', lg: '34px' }, 
              fontWeight: 'bold', 
              fontFamily: 'Outfit', 
              lineHeight: 1.3,
              mb: 2 
            }}>
              Enterprise-Grade Biometric Attendance System
            </Typography>
            <Typography sx={{ color: '#94a3b8', fontSize: '13.5px', lineHeight: 1.6 }}>
              A secure, geofenced tracking portal designed for seamless employee check-ins, leaves auditing, and smart facial verification.
            </Typography>
          </Box>

          {/* Features Highlights */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, zIndex: 2, width: '100%', maxWidth: 450 }}>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', color: '#10b981', display: 'flex' }}>
                <ShieldIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#f8fafc' }}>
                  Secure Biometric Scanning
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '11px', mt: 0.5 }}>
                  Euclidean-distance facial verification ensures spoof-free daily logging.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', color: '#38bdf8', display: 'flex' }}>
                <LocationIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#f8fafc' }}>
                  Precision Geofence Boundary
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '11px', mt: 0.5 }}>
                  Restricts punch-ins to designated coordinates and customizable radii.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', color: '#a78bfa', display: 'flex' }}>
                <AuditIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#f8fafc' }}>
                  Real-time Work Logs & Timelines
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '11px', mt: 0.5 }}>
                  Access details, selfie logs, leaf histories, and payroll metrics in real-time.
                </Typography>
              </Box>
            </Box>

          </Box>

          {/* Footer inside Left Pane */}
          <Box sx={{ mt: 'auto', pt: 4, zIndex: 2 }}>
            <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
              © {new Date().getFullYear()} SmartAttendance Inc. All rights reserved.
            </Typography>
          </Box>
        </Grid>

        {/* Right Side: Login Form Card */}
        <Grid 
          item 
          xs={12} 
          sm={7} 
          md={6} 
          lg={5}
          component={Paper}
          elevation={0}
          square
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 3, sm: 4, md: 6, lg: 8 },
            bgcolor: '#fff'
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 360 }}>
            
            {/* Header for Mobile (Only visible on xs viewports) */}
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 1, mb: 4 }}>
              <Box sx={{ 
                p: 0.6, 
                borderRadius: 2, 
                bgcolor: 'rgba(16, 185, 129, 0.1)', 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <CheckInIcon sx={{ color: '#10b981', fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', color: '#1e293b', fontSize: '14.5px' }}>
                SmartAttendance
              </Typography>
            </Box>

            {/* Login Greeting */}
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '24px', fontFamily: 'Outfit', color: '#1e293b' }}>
                Sign In
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '12.5px', fontFamily: 'Inter', mt: 0.5 }}>
                Enter your credentials below to access your portal.
              </Typography>
            </Box>

            {apiError && (
              <Alert severity="error" sx={{ mb: 2, py: 0.2, px: 1.5, fontSize: '11.5px', borderRadius: 2 }}>
                {apiError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                required
                fullWidth
                id="usernameOrEmail"
                label="Username or Email"
                name="usernameOrEmail"
                autoComplete="username"
                autoFocus
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  style: { fontSize: '13px', fontFamily: 'Inter' }
                }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
              />

              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#94a3b8' }}
                      >
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  style: { fontSize: '13px', fontFamily: 'Inter' }
                }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 1.5,
                  py: 1.4,
                  fontWeight: 'bold',
                  fontSize: '13px',
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontFamily: 'Outfit',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 12px 0 rgba(16, 185, 129, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: '0 6px 16px 0 rgba(16, 185, 129, 0.35)',
                  },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Access Portal'}
              </Button>
            </Box>

            {/* Helper Info / Footer for Mobile */}
            <Box sx={{ mt: 5, textAlign: 'center' }}>
              <Divider sx={{ mb: 2.5 }} />
              <Typography sx={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                🔒 Secure SSL encrypted connection
              </Typography>
            </Box>

          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;
