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
  Description as DocumentIcon,
  Campaign as BroadcastIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  ExpandMore as ExpandIcon,
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
                      Update your contact phone, email, and personal name details.
                    </Typography>
                  </Box>

                  {successMsg && <Alert severity="success" sx={{ py: 0.5, px: 2, fontSize: '12px', mb: 2 }}>{successMsg}</Alert>}
                  {errorMsg && <Alert severity="error" sx={{ py: 0.5, px: 2, fontSize: '12px', mb: 2 }}>{errorMsg}</Alert>}

                  {editMode ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="First Name"
                            size="small"
                            fullWidth
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            inputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                            InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Last Name"
                            size="small"
                            fullWidth
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            inputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                            InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Phone Number"
                            size="small"
                            fullWidth
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            inputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                            InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Email Address"
                            size="small"
                            fullWidth
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            inputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                            InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                          />
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={saveLoading}
                          onClick={handleSaveChanges}
                          sx={{ textTransform: 'none', fontSize: '11px', fontWeight: 'bold', px: 2.5, borderRadius: 2, bgcolor: '#1e293b' }}
                        >
                          {saveLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setEditMode(false);
                            setFormData({
                              firstName: profile?.firstName || '',
                              lastName: profile?.lastName || '',
                              phone: profile?.phone || '',
                              email: profile?.email || ''
                            });
                          }}
                          sx={{ textTransform: 'none', fontSize: '11px', fontWeight: 'bold', px: 2.5, borderRadius: 2 }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 0.5 }}>
                        <Typography sx={{ color: '#64748b', fontSize: '11px' }}>Current Address</Typography>
                        <Typography sx={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>HITEC City, Hyderabad, 500081</Typography>
                      </Box>

                      <Box sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon sx={{ fontSize: 12 }} />}
                          onClick={() => setEditMode(true)}
                          sx={{ textTransform: 'none', fontSize: '11px', fontWeight: 'bold', borderRadius: 2, color: '#2563eb', borderColor: '#2563eb' }}
                        >
                          Edit Profile Details
                        </Button>
                      </Box>
                    </Box>
                  )}
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
                  Bank Account Details
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter' }}>
                  Your verified salary payout parameters and bank settings.
                </Typography>
              </Box>

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    p: 2.5,
                    borderRadius: 3.5,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(3, 105, 161, 0.2)'
                  }}>
                    <Typography sx={{ fontSize: '9px', letterSpacing: '1.2px', textTransform: 'uppercase', opacity: 0.8, mb: 1.5 }}>
                      Salary Payout Account
                    </Typography>
                    <Typography sx={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'Outfit', mb: 3 }}>
                      State Bank of India
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
                          •••• •••• 5690
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px' }}>Bank Name</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11.5px', fontWeight: 'bold' }}>State Bank of India</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px' }}>IFSC Code</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11.5px', fontWeight: 'bold' }}>SBIN0004561</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                      <Typography sx={{ color: '#64748b', fontSize: '11.5px' }}>Branch</Typography>
                      <Typography sx={{ color: '#1e293b', fontSize: '11.5px', fontWeight: 'bold' }}>HITEC City, Hyderabad</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Panel 4: Document Hub */}
          <Accordion 
            expanded={expanded === 'documents'} 
            onChange={handleChange('documents')}
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
                bgcolor: expanded === 'documents' ? '#f8fafc' : 'transparent',
                borderBottom: expanded === 'documents' ? '1px solid #e2e8f0' : 'none',
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
                  bgcolor: '#eef2ff', 
                  color: '#4f46e5' 
                }}>
                  <DocumentIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Outfit', color: '#1e293b' }}>
                    Document Center & Contracts
                  </Typography>
                  <Typography sx={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'Inter' }}>
                    Download employment agreements, letters, and policy documents
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'Outfit', color: '#1e293b', mb: 0.5 }}>
                  Document Center
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter' }}>
                  Download your official contracts, letters of verification, and NDAs.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {['Employment_Contract.pdf', 'NDA_Agreement.pdf', 'Latest_Increment_Letter.pdf'].map((docName, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: '#e2e8f0', borderRadius: 2.5, bgcolor: '#f8fafc' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '11.5px', color: '#334155' }}>{docName}</Typography>
                      <Typography sx={{ color: '#64748b', fontSize: '9px' }}>Verified & Signed PDF</Typography>
                    </Box>
                    <Button variant="text" size="small" sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '11px', px: 1.5 }}>
                      Download
                    </Button>
                  </Paper>
                ))}
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
