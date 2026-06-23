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
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  useTheme,
  useMediaQuery,
  Grid,
  TextField,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ChevronRight as ArrowIcon,
  Badge as AccountIcon,
  AccountBalance as BankIcon,
  Person as PersonalIcon,
  Info as GeneralIcon,
  Business as EmploymentIcon,
  Campaign as BroadcastIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  ExpandMore as ExpandIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

const EmployeeSettings = () => {
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [expanded, setExpanded] = useState('personal');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Change Password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

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
      setFormData({
        firstName: res.data.firstName || '',
        lastName: res.data.lastName || '',
        phone: res.data.phone || '',
        email: res.data.email || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const handleSaveChanges = async () => {
    setSaveLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const updatedDto = {
        ...profile,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email
      };
      const res = await API.put(`/employees/${profile.id}`, updatedDto);
      setProfile(res.data);
      setSuccessMsg('Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess('');
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError('All password fields are required.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New password and confirm password do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    try {
      await API.put('/employees/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password. Check your current password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
    setEditMode(false);
  };

  return (
    <EmployeeLayout>
      <Box className="fade-in" sx={{ pb: 4 }}>
        
        {/* Page Title & Profile Summary */}
        <Card variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3.5, mb: 3, bgcolor: '#fff', borderColor: '#e2e8f0' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                width: { xs: 48, md: 56 }, 
                height: { xs: 48, md: 56 }, 
                bgcolor: '#2563eb',
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                fontWeight: 'bold',
                fontFamily: 'Outfit'
              }}>
                {profile?.firstName?.[0]?.toUpperCase() || 'E'}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px', fontFamily: 'Outfit' }}>
                  {profile ? `${profile.firstName} ${profile.lastName || ''}` : 'Employee'}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'Inter' }}>
                  {profile?.designation || 'Software Engineer'} • ID: {profile?.employeeCode || '...'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/employee/profile')}
                sx={{ 
                  flexGrow: { xs: 1, sm: 0 },
                  textTransform: 'none', 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  borderRadius: 2, 
                  bgcolor: '#2563eb',
                  px: 2,
                  py: 1
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
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  borderRadius: 2, 
                  px: 2,
                  py: 1
                }}
              >
                Sign Out
              </Button>
            </Box>
          </Box>
        </Card>

        {/* Expandable Accordion Decks */}
        <Box>
          
          {/* Panel 1: Personal & Security */}
          <Accordion 
            expanded={expanded === 'personal'} 
            onChange={handleChange('personal')}
            sx={{
              mb: 1.8,
              borderRadius: '12px !important',
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandIcon sx={{ color: '#64748b' }} />}
              sx={{ 
                bgcolor: expanded === 'personal' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'personal' ? '1px solid #e2e8f0' : 'none',
                minHeight: 58,
                px: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 36, 
                  height: 36, 
                  borderRadius: 2.5, 
                  bgcolor: '#eff6ff', 
                  color: '#2563eb' 
                }}>
                  <PersonalIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#1e293b' }}>
                    Personal Details & Preferences
                  </Typography>
                  <Typography sx={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'Inter' }}>
                    Manage contact profile details, notification preferences and toggles
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
              <Grid container spacing={3}>
                {/* Left: Edit Form */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'Outfit', color: '#1e293b', mb: 0.5 }}>
                      Profile Information
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter' }}>
                      View your official profile, contact email, and personal name details. (Read-only)
                    </Typography>
                  </Box>

                  {successMsg && <Alert severity="success" sx={{ py: 0.5, px: 2, fontSize: '12px', mb: 2 }}>{successMsg}</Alert>}
                  {errorMsg && <Alert severity="error" sx={{ py: 0.5, px: 2, fontSize: '12px', mb: 2 }}>{errorMsg}</Alert>}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Full Name</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>
                        {profile ? `${profile.firstName} ${profile.lastName || ''}` : '...'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Email Address</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>{profile?.email || '...'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Phone Number</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>{profile?.phone || 'Not Provided'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Emergency Contact</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>+91 9876543210</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Current Address</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>HITEC City, Hyderabad, 500081</Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Right: Preferences Switches */}
                <Grid item xs={12} md={5}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 3.5, bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#1e293b', mb: 1.5 }}>
                      Preferences & Security
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.emailAlerts}
                            onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                            size="small"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontSize: '11.5px', fontWeight: 'bold', color: '#334155' }}>Email Alerts</Typography>
                            <Typography sx={{ fontSize: '9.5px', color: '#64748b' }}>Receive check-in summary logs via email</Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                      />

                      <Divider />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.pushNotifications}
                            onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                            size="small"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontSize: '11.5px', fontWeight: 'bold', color: '#334155' }}>Push Notifications</Typography>
                            <Typography sx={{ fontSize: '9.5px', color: '#64748b' }}>Receive browser clock reminders</Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                      />

                      <Divider />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.locationVerification}
                            onChange={(e) => setPreferences({ ...preferences, locationVerification: e.target.checked })}
                            size="small"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontSize: '11.5px', fontWeight: 'bold', color: '#334155' }}>Location Verification</Typography>
                            <Typography sx={{ fontSize: '9.5px', color: '#64748b' }}>Allow high-precision geofencing</Typography>
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

          {/* Panel 2: Employment Details */}
          <Accordion 
            expanded={expanded === 'employment'} 
            onChange={handleChange('employment')}
            sx={{
              mb: 1.8,
              borderRadius: '12px !important',
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandIcon sx={{ color: '#64748b' }} />}
              sx={{ 
                bgcolor: expanded === 'employment' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'employment' ? '1px solid #e2e8f0' : 'none',
                minHeight: 58,
                px: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 36, 
                  height: 36, 
                  borderRadius: 2.5, 
                  bgcolor: '#f5f3ff', 
                  color: '#7c3aed' 
                }}>
                  <EmploymentIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#1e293b' }}>
                    Employment & Geofencing Parameters
                  </Typography>
                  <Typography sx={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'Inter' }}>
                    Audit contract limits, designation levels, and geofence locations
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'Outfit', color: '#1e293b', mb: 0.5 }}>
                  Employment Details
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter' }}>
                  Audit your active designation details, corporate contracts, and geofence coordinates.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', mb: 0.5 }}>
                      Employee Code
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
                      {profile?.employeeCode || '...'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', mb: 0.5 }}>
                      Department
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
                      {profile?.department || '...'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', mb: 0.5 }}>
                      Designation
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
                      {profile?.designation || '...'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', mb: 0.5 }}>
                      Date of Joining
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
                      {profile?.joiningDate || 'Not Provided'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', mb: 0.5 }}>
                      Roster Schedule
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
                      {profile?.rosterSchedule || 'General Shift (10:00 AM - 06:30 PM) | Offs: Saturday, Sunday'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <Typography sx={{ color: '#1e3a8a', fontSize: '11px', fontWeight: 'bold', mb: 1 }}>
                      📍 Geofence Boundary Coordinates
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography sx={{ color: '#1e3a8a', fontSize: '9px', opacity: 0.8 }}>Latitude</Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>{profile?.customLatitude || '17.4483'}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: '#1e3a8a', fontSize: '9px', opacity: 0.8 }}>Longitude</Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>{profile?.customLongitude || '78.3741'}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: '#1e3a8a', fontSize: '9px', opacity: 0.8 }}>Radius Limit</Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>{profile?.customRadiusMeters || '200'} Meters</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Panel 3: Salary & Bank */}
          <Accordion 
            expanded={expanded === 'bank'} 
            onChange={handleChange('bank')}
            sx={{
              mb: 1.8,
              borderRadius: '12px !important',
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandIcon sx={{ color: '#64748b' }} />}
              sx={{ 
                bgcolor: expanded === 'bank' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'bank' ? '1px solid #e2e8f0' : 'none',
                minHeight: 58,
                px: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 36, 
                  height: 36, 
                  borderRadius: 2.5, 
                  bgcolor: '#f0fdfa', 
                  color: '#0d9488' 
                }}>
                  <BankIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#1e293b' }}>
                    Salary & Bank Details
                  </Typography>
                  <Typography sx={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'Inter' }}>
                    Verify active salary accounts, holders, and banking IFSC branch metrics
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'Outfit', color: '#1e293b', mb: 0.5 }}>
                  Salary & Bank Account Parameters
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter' }}>
                  Your verified bank payout credentials and active monthly salary structure.
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Left: Bank Account Payout Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1.5, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🏦 Bank Payout Details
                  </Typography>
                  
                  {profile?.accountNumber ? (
                    <Box sx={{
                      p: 2.5,
                      borderRadius: 3.5,
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 14px rgba(3, 105, 161, 0.2)',
                      mb: 2
                    }}>
                      <Typography sx={{ fontSize: '9px', letterSpacing: '1.2px', textTransform: 'uppercase', opacity: 0.8, mb: 1.5 }}>
                        Salary Payout Account
                      </Typography>
                      <Typography sx={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'Outfit', mb: 3 }}>
                        {profile?.bankName || 'Not Set'}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Box>
                          <Typography sx={{ fontSize: '8px', opacity: 0.8, textTransform: 'uppercase' }}>
                            Account Holder
                          </Typography>
                          <Typography sx={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'Outfit' }}>
                            {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Employee'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontSize: '8px', opacity: 0.8, textTransform: 'uppercase' }}>
                            Account Number
                          </Typography>
                          <Typography sx={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'Outfit' }}>
                            {profile?.accountNumber ? `•••• •••• ${profile.accountNumber.slice(-4)}` : 'Not Set'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ p: 3, borderRadius: 3.5, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', textAlign: 'center', mb: 2 }}>
                      <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'Inter' }}>
                        No bank account details registered by HR yet.
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 0.8 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Bank Name</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>{profile?.bankName || 'Not Set'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 0.8 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Account Number</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>{profile?.accountNumber || 'Not Set'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 0.8 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11px' }}>IFSC Code</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>{profile?.ifscCode || 'Not Set'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 0.8 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Branch Name</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>{profile?.branchName || 'Not Set'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Right: Salary Breakdown Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1.5, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
                    💰 Salary Structure
                  </Typography>

                  {profile?.netTakeHome !== null && profile?.netTakeHome !== undefined ? (
                    <>
                      <Box sx={{
                        p: 2.5,
                        borderRadius: 3.5,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)',
                        mb: 2
                      }}>
                        <Typography sx={{ fontSize: '9px', letterSpacing: '1.2px', textTransform: 'uppercase', opacity: 0.8, mb: 1 }}>
                          Net Take Home (Monthly)
                        </Typography>
                        <Typography sx={{ fontSize: '22px', fontWeight: 'bold', fontFamily: 'Outfit' }}>
                          ₹{profile.netTakeHome.toLocaleString('en-IN')}
                        </Typography>
                        <Typography sx={{ fontSize: '9px', opacity: 0.8, mt: 1 }}>
                          Calculated from standard employee pay terms.
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 0.8 }}>
                          <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Basic Pay</Typography>
                          <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>
                            {profile.basicPay ? `₹${profile.basicPay.toLocaleString('en-IN')}` : '₹0'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 0.8 }}>
                          <Typography sx={{ color: '#64748b', fontSize: '11px' }}>HRA</Typography>
                          <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>
                            {profile.hra ? `₹${profile.hra.toLocaleString('en-IN')}` : '₹0'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 0.8 }}>
                          <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Special Allowance</Typography>
                          <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>
                            {profile.specialAllowance ? `₹${profile.specialAllowance.toLocaleString('en-IN')}` : '₹0'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 0.8 }}>
                          <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Deductions (PF/Tax)</Typography>
                          <Typography sx={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>
                            {profile.deductions ? `₹${profile.deductions.toLocaleString('en-IN')}` : '₹0'}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ p: 4, borderRadius: 3.5, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', textAlign: 'center', height: '70%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'Inter' }}>
                        Salary structures are not configured by HR yet.
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Panel 4: Change Password */}
          <Accordion
            expanded={expanded === 'security'}
            onChange={handleChange('security')}
            sx={{
              mb: 1.8,
              borderRadius: '12px !important',
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandIcon sx={{ color: '#64748b' }} />}
              sx={{
                bgcolor: expanded === 'security' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'security' ? '1px solid #e2e8f0' : 'none',
                minHeight: 58,
                px: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 2.5, bgcolor: '#fef3c7', color: '#d97706'
                }}>
                  <LockIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#1e293b' }}>
                    Security &amp; Password
                  </Typography>
                  <Typography sx={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'Inter' }}>
                    Change your login password using your current password
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ maxWidth: 480 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'Outfit', color: '#1e293b', mb: 0.5 }}>
                  Change Password
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter', mb: 2.5 }}>
                  Enter your current password and a new secure password to update your credentials.
                </Typography>

                {pwSuccess && <Alert severity="success" sx={{ mb: 2, py: 0.5, fontSize: '12px' }}>{pwSuccess}</Alert>}
                {pwError && <Alert severity="error" sx={{ mb: 2, py: 0.5, fontSize: '12px' }}>{pwError}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Current Password"
                    type={showCurrentPw ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    InputProps={{
                      style: { fontSize: '13px', fontFamily: 'Inter' },
                      endAdornment: (
                        <IconButton size="small" onClick={() => setShowCurrentPw(!showCurrentPw)} edge="end">
                          {showCurrentPw ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      )
                    }}
                    InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="New Password"
                    type={showNewPw ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    InputProps={{
                      style: { fontSize: '13px', fontFamily: 'Inter' },
                      endAdornment: (
                        <IconButton size="small" onClick={() => setShowNewPw(!showNewPw)} edge="end">
                          {showNewPw ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      )
                    }}
                    InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                    helperText="Minimum 6 characters"
                    FormHelperTextProps={{ style: { fontSize: '10px', fontFamily: 'Inter' } }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Confirm New Password"
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                    InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleChangePassword}
                    disabled={pwLoading}
                    startIcon={pwLoading ? null : <LockIcon sx={{ fontSize: 15 }} />}
                    sx={{
                      alignSelf: 'flex-start',
                      textTransform: 'none',
                      fontFamily: 'Outfit',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      borderRadius: 2,
                      px: 3,
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                      boxShadow: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Panel 5: Broadcast Messages */}
          <Accordion 
            expanded={expanded === 'broadcast'} 
            onChange={handleChange('broadcast')}
            sx={{
              mb: 1.8,
              borderRadius: '12px !important',
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandIcon sx={{ color: '#64748b' }} />}
              sx={{ 
                bgcolor: expanded === 'broadcast' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'broadcast' ? '1px solid #e2e8f0' : 'none',
                minHeight: 58,
                px: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 36, 
                  height: 36, 
                  borderRadius: 2.5, 
                  bgcolor: '#ecfeff', 
                  color: '#0891b2' 
                }}>
                  <BroadcastIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#1e293b' }}>
                    Broadcast logs
                  </Typography>
                  <Typography sx={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'Inter' }}>
                    Read active broadcast statements, notices, and human resource alerts
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'Outfit', color: '#1e293b', mb: 0.5 }}>
                  Broadcast Logs
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter' }}>
                  Important team notices and corporate announcements.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ p: 2, bgcolor: '#ecfeff', borderRadius: 3, borderLeft: '4px solid #0891b2' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '12px', color: '#0891b2', mb: 0.5 }}>📢 Holiday Notice</Typography>
                  <Typography sx={{ color: '#164e63', fontSize: '11px', lineHeight: 1.5 }}>25th Dec will be a national holiday on account of Christmas.</Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: '#ecfeff', borderRadius: 3, borderLeft: '4px solid #0891b2' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '12px', color: '#0891b2', mb: 0.5 }}>📢 App Update Required</Typography>
                  <Typography sx={{ color: '#164e63', fontSize: '11px', lineHeight: 1.5 }}>Please complete facial biometrics template registration for high security attendance logging.</Typography>
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
