import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import EmployeeLayout from '../layouts/EmployeeLayout';
import { logout } from '../redux/authSlice';
import API from '../api';
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  Divider,
  Chip,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Person as PersonalIcon,
  Info as GeneralIcon,
  Business as EmploymentIcon,
  Description as DocumentIcon,
  Campaign as BroadcastIcon,
  ExpandMore as ExpandIcon,
  AccountBalance as BankIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

const EmployeeSettings = () => {
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [expanded, setExpanded] = useState('personal');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    pushNotifications: true,
    locationVerification: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/employees/me');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <EmployeeLayout>
      <Box className="fade-in" sx={{ pb: { xs: 3, md: 5 } }}>
        
        {/* 1. Sleek Outside Header Banner */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 3.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 42, md: 50 },
              height: { xs: 42, md: 50 },
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
            }}>
              <SettingsIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.4rem', md: '1.85rem' }, fontFamily: 'Outfit', letterSpacing: '-0.5px' }}>
                Profile & Settings
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '12px', md: '13px' }, mt: 0.2, fontFamily: 'Inter' }}>
                Review secure personal credentials, bank details, and geofencing parameters
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate('/employee/profile')}
              sx={{
                flexGrow: { xs: 1, sm: 0 },
                textTransform: 'none',
                fontFamily: 'Outfit',
                fontSize: '11.5px',
                fontWeight: 700,
                borderRadius: 2.5,
                bgcolor: '#2563eb',
                boxShadow: 'none',
                px: 2.5,
                py: 1,
                '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' }
              }}
            >
              Register Face Biometrics
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleLogout}
              sx={{
                flexGrow: { xs: 1, sm: 0 },
                textTransform: 'none',
                fontFamily: 'Outfit',
                fontSize: '11.5px',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 2.5,
                py: 1,
                borderWidth: '1px',
                '&:hover': { borderWidth: '1px', bgcolor: '#fef2f2' }
              }}
            >
              Sign Out
            </Button>
          </Box>
        </Box>

        {/* 2. Compact Identity Overview Card */}
        <Card 
          sx={{ 
            borderRadius: 4, 
            border: '1px solid #f1f5f9', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)', 
            mb: 3.5, 
            bgcolor: '#fff',
            p: 2.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              width: 54, 
              height: 54, 
              bgcolor: '#10b981',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              fontFamily: 'Outfit'
            }}>
              {profile?.firstName?.[0]?.toUpperCase() || 'E'}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 'bold', color: '#0f172a', fontSize: '16.5px', fontFamily: 'Outfit' }}>
                {profile ? `${profile.firstName} ${profile.lastName || ''}` : 'Employee'}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '12px', fontFamily: 'Inter', mt: 0.3 }}>
                {profile?.designation || 'Software Engineer'} • {profile?.department || 'Engineering'} • Code: <strong>{profile?.employeeCode || '...'}</strong>
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* 3. Expandable Accordion Decks */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* Panel 1: Personal Details & Preferences */}
          <Accordion 
            expanded={expanded === 'personal'} 
            onChange={handleChange('personal')}
            sx={{
              borderRadius: '16px !important',
              border: '1px solid #f1f5f9',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandIcon sx={{ color: '#94a3b8' }} />}
              sx={{ 
                bgcolor: expanded === 'personal' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'personal' ? '1px solid #f1f5f9' : 'none',
                minHeight: 64,
                px: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 38, 
                  height: 38, 
                  borderRadius: 2.5, 
                  bgcolor: '#eff6ff', 
                  color: '#2563eb' 
                }}>
                  <PersonalIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13.5px', fontFamily: 'Outfit', color: '#0f172a' }}>
                    Personal Details & Preferences
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter', mt: 0.2 }}>
                    Review contact profile details and configure notification alerts
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Grid container spacing={4}>
                {/* Left Side: Read-Only Profile Details */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '14.5px', fontFamily: 'Outfit', color: '#0f172a', mb: 0.5 }}>
                      Profile Information
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>
                      Secure employee credentials registered in the database.
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', pb: 1.2 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>Full Name</Typography>
                      <Typography sx={{ color: '#0f172a', fontSize: '12px', fontWeight: 700, fontFamily: 'Outfit' }}>
                        {profile ? `${profile.firstName} ${profile.lastName || ''}` : '...'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', pb: 1.2 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>Email Address</Typography>
                      <Typography sx={{ color: '#0f172a', fontSize: '12px', fontWeight: 700, fontFamily: 'Outfit' }}>{profile?.email || '...'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', pb: 1.2 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>Phone Number</Typography>
                      <Typography sx={{ color: '#0f172a', fontSize: '12px', fontWeight: 700, fontFamily: 'Outfit' }}>{profile?.phone || 'Not Provided'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', pb: 1.2 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>Emergency Contact</Typography>
                      <Typography sx={{ color: '#0f172a', fontSize: '12px', fontWeight: 700, fontFamily: 'Outfit' }}>+91 9876543210</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 0.5 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>Current Address</Typography>
                      <Typography sx={{ color: '#0f172a', fontSize: '12px', fontWeight: 700, fontFamily: 'Outfit' }}>HITEC City, Hyderabad, 500081</Typography>
                    </Box>

                    {/* Highly descriptive HR-lock advisory badge */}
                    <Box 
                      sx={{ 
                        mt: 2, 
                        p: 1.8, 
                        borderRadius: 3, 
                        bgcolor: '#f8fafc', 
                        border: '1px dashed #e2e8f0', 
                        display: 'flex', 
                        gap: 1.5, 
                        alignItems: 'flex-start' 
                      }}
                    >
                      <LockIcon sx={{ color: '#94a3b8', fontSize: 16, mt: 0.2 }} />
                      <Box>
                        <Typography sx={{ color: '#475569', fontSize: '11px', fontWeight: 'bold', fontFamily: 'Outfit' }}>
                          Information Modifiability Restricted
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '10px', fontFamily: 'Inter', mt: 0.2, lineHeight: 1.4 }}>
                          To protect geofencing logs, payroll validation, and tax declarations, employees cannot modify their personal profile information. If any details are incorrect, please contact your HR Administrator.
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Right Side: Preferences Switches */}
                <Grid item xs={12} md={5}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 2.2, 
                      borderRadius: 3.5, 
                      bgcolor: '#f8fafc', 
                      borderColor: '#e2e8f0',
                      boxShadow: 'none'
                    }}
                  >
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#0f172a', mb: 2 }}>
                      Preferences & Alerts
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.emailAlerts}
                            onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                            size="small"
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', fontFamily: 'Outfit' }}>Email Alerts</Typography>
                            <Typography sx={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'Inter', mt: 0.1 }}>Check-in receipt logs via email</Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                      />

                      <Divider sx={{ borderColor: '#e2e8f0' }} />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.pushNotifications}
                            onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                            size="small"
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', fontFamily: 'Outfit' }}>Push Notifications</Typography>
                            <Typography sx={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'Inter', mt: 0.1 }}>Receive daily browser clock reminders</Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                      />

                      <Divider sx={{ borderColor: '#e2e8f0' }} />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.locationVerification}
                            onChange={(e) => setPreferences({ ...preferences, locationVerification: e.target.checked })}
                            size="small"
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', fontFamily: 'Outfit' }}>Location Verification</Typography>
                            <Typography sx={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'Inter', mt: 0.1 }}>Allow high-accuracy GPS scans</Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                      />
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Panel 2: Employment Parameters */}
          <Accordion 
            expanded={expanded === 'employment'} 
            onChange={handleChange('employment')}
            sx={{
              borderRadius: '16px !important',
              border: '1px solid #f1f5f9',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandIcon sx={{ color: '#94a3b8' }} />}
              sx={{ 
                bgcolor: expanded === 'employment' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'employment' ? '1px solid #f1f5f9' : 'none',
                minHeight: 64,
                px: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 38, 
                  height: 38, 
                  borderRadius: 2.5, 
                  bgcolor: '#f5f3ff', 
                  color: '#7c3aed' 
                }}>
                  <EmploymentIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13.5px', fontFamily: 'Outfit', color: '#0f172a' }}>
                    Employment & Geofencing Parameters
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter', mt: 0.2 }}>
                    Verify corporate designations, joining terms, and office location limits
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '14.5px', fontFamily: 'Outfit', color: '#0f172a', mb: 0.5 }}>
                  Corporate Parameters
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>
                  Official registration configuration assigned to your contract.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', mb: 0.5, fontFamily: 'Inter' }}>
                      Employee Code
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13.5px', color: '#0f172a', fontFamily: 'Outfit' }}>
                      {profile?.employeeCode || '...'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', mb: 0.5, fontFamily: 'Inter' }}>
                      Department
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13.5px', color: '#0f172a', fontFamily: 'Outfit' }}>
                      {profile?.department || '...'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', mb: 0.5, fontFamily: 'Inter' }}>
                      Designation
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13.5px', color: '#0f172a', fontFamily: 'Outfit' }}>
                      {profile?.designation || '...'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', mb: 0.5, fontFamily: 'Inter' }}>
                      Joining Date
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13.5px', color: '#0f172a', fontFamily: 'Outfit' }}>
                      {profile?.joiningDate || 'Not Provided'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ p: 2, borderRadius: 3.5, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', mt: 1 }}>
                    <Typography sx={{ color: '#1e3a8a', fontSize: '12px', fontWeight: 'bold', mb: 1.5, fontFamily: 'Outfit' }}>
                      📍 Geofence Boundary Coordinates
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      <Box>
                        <Typography sx={{ color: '#1e3a8a', fontSize: '9.5px', opacity: 0.8, fontFamily: 'Inter' }}>Latitude</Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af', fontFamily: 'Outfit', mt: 0.2 }}>{profile?.customLatitude || '17.4483'}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: '#1e3a8a', fontSize: '9.5px', opacity: 0.8, fontFamily: 'Inter' }}>Longitude</Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af', fontFamily: 'Outfit', mt: 0.2 }}>{profile?.customLongitude || '78.3741'}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: '#1e3a8a', fontSize: '9.5px', opacity: 0.8, fontFamily: 'Inter' }}>Radius Limit</Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af', fontFamily: 'Outfit', mt: 0.2 }}>{profile?.customRadiusMeters || '200'} Meters</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Panel 3: Salary & Payout Bank */}
          <Accordion 
            expanded={expanded === 'bank'} 
            onChange={handleChange('bank')}
            sx={{
              borderRadius: '16px !important',
              border: '1px solid #f1f5f9',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandIcon sx={{ color: '#94a3b8' }} />}
              sx={{ 
                bgcolor: expanded === 'bank' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'bank' ? '1px solid #f1f5f9' : 'none',
                minHeight: 64,
                px: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 38, 
                  height: 38, 
                  borderRadius: 2.5, 
                  bgcolor: '#f0fdfa', 
                  color: '#0d9488' 
                }}>
                  <BankIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13.5px', fontFamily: 'Outfit', color: '#0f172a' }}>
                    Salary & Bank Details
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter', mt: 0.2 }}>
                    Verify active salary accounts, holders, and banking IFSC branch metrics
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '14.5px', fontFamily: 'Outfit', color: '#0f172a', mb: 0.5 }}>
                  Bank Account Configuration
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>
                  Official payout card details for monthly payroll deposit.
                </Typography>
              </Box>

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    p: 2.5,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(3, 105, 161, 0.2)'
                  }}>
                    <Typography sx={{ fontSize: '9px', letterSpacing: '1.2px', textTransform: 'uppercase', opacity: 0.8, mb: 2, fontFamily: 'Inter' }}>
                      Salary Deposit Card
                    </Typography>
                    <Typography sx={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'Outfit', mb: 3.5 }}>
                      State Bank of India
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Box>
                        <Typography sx={{ fontSize: '8px', opacity: 0.8, textTransform: 'uppercase', fontFamily: 'Inter' }}>
                          Account Holder
                        </Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'Outfit', mt: 0.2 }}>
                          {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Employee'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '8px', opacity: 0.8, textTransform: 'uppercase', fontFamily: 'Inter' }}>
                          Account Number
                        </Typography>
                        <Typography sx={{ fontSize: '12.5px', fontWeight: 'bold', fontFamily: 'Outfit', mt: 0.2 }}>
                          •••• •••• 5690
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', pb: 1.2 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>Bank Name</Typography>
                      <Typography sx={{ color: '#0f172a', fontSize: '11.5px', fontWeight: 'bold', fontFamily: 'Outfit' }}>State Bank of India</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', pb: 1.2 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>IFSC Code</Typography>
                      <Typography sx={{ color: '#0f172a', fontSize: '11.5px', fontWeight: 'bold', fontFamily: 'Outfit' }}>SBIN0004561</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 0.5 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>Branch Location</Typography>
                      <Typography sx={{ color: '#0f172a', fontSize: '11.5px', fontWeight: 'bold', fontFamily: 'Outfit' }}>HITEC City, Hyderabad</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Panel 4: Document Center */}
          <Accordion 
            expanded={expanded === 'documents'} 
            onChange={handleChange('documents')}
            sx={{
              borderRadius: '16px !important',
              border: '1px solid #f1f5f9',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandIcon sx={{ color: '#94a3b8' }} />}
              sx={{ 
                bgcolor: expanded === 'documents' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'documents' ? '1px solid #f1f5f9' : 'none',
                minHeight: 64,
                px: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 38, 
                  height: 38, 
                  borderRadius: 2.5, 
                  bgcolor: '#eef2ff', 
                  color: '#4f46e5' 
                }}>
                  <DocumentIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13.5px', fontFamily: 'Outfit', color: '#0f172a' }}>
                    Document Center & Contracts
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter', mt: 0.2 }}>
                    Download secure employment agreements, increment letters, and NDAs
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '14.5px', fontFamily: 'Outfit', color: '#0f172a', mb: 0.5 }}>
                  Contracts & NDAs
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>
                  Download verified PDF agreements signed during onboarding.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {['Employment_Contract.pdf', 'NDA_Agreement.pdf', 'Latest_Increment_Letter.pdf'].map((docName, index) => (
                  <Paper 
                    key={index} 
                    variant="outlined" 
                    sx={{ 
                      p: 1.8, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      borderColor: '#e2e8f0', 
                      borderRadius: 3, 
                      bgcolor: '#f8fafc',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: '#cbd5e1', bgcolor: '#fff' }
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '12px', color: '#334155', fontFamily: 'Outfit' }}>{docName}</Typography>
                      <Typography sx={{ color: '#94a3b8', fontSize: '9.5px', fontFamily: 'Inter', mt: 0.1 }}>Verified & Cryptographically Signed</Typography>
                    </Box>
                    <Button 
                      variant="text" 
                      size="small" 
                      sx={{ 
                        textTransform: 'none', 
                        fontWeight: 'bold', 
                        fontSize: '11.5px', 
                        px: 2,
                        fontFamily: 'Outfit',
                        color: '#2563eb'
                      }}
                    >
                      Download
                    </Button>
                  </Paper>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Panel 5: Broadcast Notices */}
          <Accordion 
            expanded={expanded === 'broadcast'} 
            onChange={handleChange('broadcast')}
            sx={{
              borderRadius: '16px !important',
              border: '1px solid #f1f5f9',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandIcon sx={{ color: '#94a3b8' }} />}
              sx={{ 
                bgcolor: expanded === 'broadcast' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'broadcast' ? '1px solid #f1f5f9' : 'none',
                minHeight: 64,
                px: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 38, 
                  height: 38, 
                  borderRadius: 2.5, 
                  bgcolor: '#ecfeff', 
                  color: '#0891b2' 
                }}>
                  <BroadcastIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13.5px', fontFamily: 'Outfit', color: '#0f172a' }}>
                    Broadcast Notices & Bulletins
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter', mt: 0.2 }}>
                    Read active broadcast statements, notices, and human resource alerts
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '14.5px', fontFamily: 'Outfit', color: '#0f172a', mb: 0.5 }}>
                  Announcements Log
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>
                  Important team bulletins and corporate notifications.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: '#ecfeff', borderRadius: 3.5, borderLeft: '4px solid #0891b2' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '12.5px', color: '#0891b2', mb: 0.5, fontFamily: 'Outfit' }}>📢 Holiday Announcement</Typography>
                  <Typography sx={{ color: '#164e63', fontSize: '11.5px', fontFamily: 'Inter', lineHeight: 1.5 }}>25th Dec will be a national holiday on account of Christmas.</Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: '#ecfeff', borderRadius: 3.5, borderLeft: '4px solid #0891b2' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '12.5px', color: '#0891b2', mb: 0.5, fontFamily: 'Outfit' }}>📢 Facial Biometrics Policy</Typography>
                  <Typography sx={{ color: '#164e63', fontSize: '11.5px', fontFamily: 'Inter', lineHeight: 1.5 }}>Please complete facial biometrics template registration for high security attendance logging.</Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

        </Box>

      </Box>
    </EmployeeLayout>
  );
};

export default EmployeeSettings;
