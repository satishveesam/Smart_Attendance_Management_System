import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import API from '../api';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  Alert,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Alarm as LateIcon,
  Percent as PercentIcon,
  QrCode2 as QrCodeIcon,
  PinDrop as PinIcon,
  MyLocation as DetectIcon,
  Timeline as TrendsIcon,
  AdminPanelSettings as ShieldIcon,
  Wifi as LiveIcon,
  Map as MapIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // QR Dialog state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(''); // Holds secure local object URL for QR image
  const [qrLoading, setQrLoading] = useState(false);

  // Geofence Location Settings state
  const [locationOpen, setLocationOpen] = useState(false);
  const [locLatitude, setLocLatitude] = useState('');
  const [locLongitude, setLocLongitude] = useState('');
  const [locRadius, setLocRadius] = useState('');
  const [locSaving, setLocSaving] = useState(false);
  const [locError, setLocError] = useState('');
  const [locSuccess, setLocSuccess] = useState('');

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchOfficeLocationOnMount();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await API.get('/dashboard/admin/stats');
      const chartsRes = await API.get('/dashboard/admin/charts');
      setStats(statsRes.data);
      setChartData(Array.isArray(chartsRes.data) ? chartsRes.data : []);
    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch office location on load to display immediately on the Radar card (Null-Safe!)
  const fetchOfficeLocationOnMount = async () => {
    try {
      const res = await API.get('/attendance/office-location');
      if (res.data) {
        setLocLatitude(res.data.latitude || '');
        setLocLongitude(res.data.longitude || '');
        setLocRadius(res.data.radiusMeters || '');
      } else {
        setLocLatitude('');
        setLocLongitude('');
        setLocRadius('');
      }
    } catch (err) {
      console.error("Failed to load geofence on mount", err);
    }
  };

  const handleOpenLocationSettings = async () => {
    setLocError('');
    setLocSuccess('');
    setLocationOpen(true);
    try {
      const res = await API.get('/attendance/office-location');
      if (res.data) {
        setLocLatitude(res.data.latitude || '');
        setLocLongitude(res.data.longitude || '');
        setLocRadius(res.data.radiusMeters || '');
      } else {
        setLocLatitude('');
        setLocLongitude('');
        setLocRadius('');
      }
    } catch (err) {
      console.error("Failed to load office geofence location settings", err);
      setLocError("Failed to fetch current geofencing settings.");
    }
  };

  const handleDetectCurrentLocation = () => {
    setLocError('');
    setLocSuccess('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocLatitude(position.coords.latitude);
          setLocLongitude(position.coords.longitude);
          setLocSuccess("Detected current GPS location successfully!");
        },
        (err) => {
          console.error(err);
          setLocError("Unable to acquire location. Please grant location permissions.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocError("Browser does not support geolocation detection.");
    }
  };

  const handleSaveLocationSettings = async (e) => {
    e.preventDefault();
    setLocSaving(true);
    setLocError('');
    setLocSuccess('');
    try {
      const payload = {
        latitude: parseFloat(locLatitude),
        longitude: parseFloat(locLongitude),
        radiusMeters: parseFloat(locRadius),
      };
      if (isNaN(payload.latitude) || isNaN(payload.longitude) || isNaN(payload.radiusMeters)) {
        throw new Error("All fields must be valid numeric coordinates and radius.");
      }
      const res = await API.post('/attendance/office-location', payload);
      setLocSuccess("Office geofence work location updated successfully!");
      if (res.data) {
        setLocLatitude(res.data.latitude || '');
        setLocLongitude(res.data.longitude || '');
        setLocRadius(res.data.radiusMeters || '');
      }
      
      // Refresh stats
      const statsRes = await API.get('/dashboard/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to save geofence location settings", err);
      setLocError(err.response?.data?.message || err.message || "Failed to update settings.");
    } finally {
      setLocSaving(false);
    }
  };

  // ADVANCED SECURE QR GENERATION: Fetch image as Blob using authenticated Axios
  const handleGenerateQr = async () => {
    setQrLoading(true);
    setQrOpen(true);
    setQrCodeUrl('');
    try {
      const res = await API.get('/attendance/generate-qr');
      const token = res.data.token;
      setQrToken(token);
      
      // Fetch the QR image using authenticated API instance to send the JWT token
      const imgRes = await API.get(`/attendance/qr-code/${token}`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(imgRes.data);
      setQrCodeUrl(blobUrl);
    } catch (err) {
      console.error("Failed to generate secure QR token or image", err);
    } finally {
      setQrLoading(false);
    }
  };

  const handleCloseQr = () => {
    setQrOpen(false);
    if (qrCodeUrl) {
      URL.revokeObjectURL(qrCodeUrl); // Clean up browser memory
      setQrCodeUrl('');
    }
  };

  // Safe Coordinate & Radius formatters to prevent runtime crashes
  const formatCoordinate = (coord) => {
    if (coord === null || coord === undefined || coord === '') return 'Not Configured';
    const num = Number(coord);
    return isNaN(num) ? 'Invalid' : num.toFixed(6);
  };

  const formatRadius = (rad) => {
    if (rad === null || rad === undefined || rad === '') return 'Not Configured';
    const num = Number(rad);
    return isNaN(num) ? 'Invalid' : `${num} meters`;
  };

  // Custom Chart Tooltip component (Dark Glassmorphism)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{
          bgcolor: 'rgba(15, 23, 42, 0.95)',
          color: '#fff',
          p: 1.8,
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
          fontFamily: 'Inter',
          fontSize: '12px',
          backdropFilter: 'blur(4px)'
        }}>
          <Typography sx={{ fontWeight: 'bold', mb: 1, fontFamily: 'Outfit', color: '#38bdf8' }}>{label}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            {payload.map((p, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
                <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>
                  {p.name}: <strong style={{ color: '#fff' }}>{p.value}</strong>
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      );
    }
    return null;
  };

  const formattedDateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const formattedTimeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Extract stats with robust fallbacks to prevent crashes
  const totalEmployees = stats?.totalEmployees ?? 0;
  const presentToday = stats?.presentToday ?? 0;
  const absentToday = stats?.absentToday ?? 0;
  const lateArrivals = stats?.lateArrivals ?? 0;
  const attendancePercentage = stats?.attendancePercentage ?? 0;

  const statCards = [
    {
      title: 'Total Employees',
      value: totalEmployees,
      indicator: 'Registered staff',
      icon: <PeopleIcon sx={{ fontSize: 18, color: '#3b82f6' }} />,
      badge: { label: 'Staff', color: '#2563eb', bg: '#eff6ff' },
      path: '/admin/employees'
    },
    {
      title: 'Present Today',
      value: presentToday,
      indicator: `${attendancePercentage.toFixed(0)}% presence rate`,
      icon: <PresentIcon sx={{ fontSize: 18, color: '#10b981' }} />,
      badge: { label: 'Live', color: '#16a34a', bg: '#f0fdf4' },
      path: '/admin/attendance'
    },
    {
      title: 'Absent Today',
      value: absentToday,
      indicator: 'Pending check-in',
      icon: <AbsentIcon sx={{ fontSize: 18, color: '#ef4444' }} />,
      badge: { label: 'Absent', color: '#dc2626', bg: '#fef2f2' },
      path: '/admin/attendance'
    },
    {
      title: 'Late Arrivals',
      value: lateArrivals,
      indicator: 'After 9:15 AM',
      icon: <LateIcon sx={{ fontSize: 18, color: '#f59e0b' }} />,
      badge: { label: 'Late', color: '#d97706', bg: '#fffbeb' },
      path: '/admin/attendance'
    },
    {
      title: 'Attendance %',
      value: `${attendancePercentage.toFixed(1)}%`,
      indicator: 'Today\'s score',
      icon: <PercentIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />,
      badge: { label: 'Rate', color: '#7e22ce', bg: '#faf5ff' },
      path: '/admin/attendance'
    },
  ];

  return (
    <AdminLayout>
      {/* 1. Dashboard Header Banner */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3
      }}>
        {/* Welcome Text with Live Time */}
        <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{ p: 0.6, borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb', display: 'flex' }}>
              <ShieldIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit', letterSpacing: '-0.3px', fontSize: { xs: '20px', sm: '26px' } }}>
              Operations Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '13px', fontWeight: 500 }}>
              {formattedDateString}
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#cbd5e1', display: { xs: 'none', sm: 'block' } }} />
            <Typography variant="body2" sx={{ color: '#2563eb', fontFamily: 'Outfit', fontSize: '13.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', animation: 'pulse 1.8s infinite' }} />
              {formattedTimeString}
            </Typography>
          </Box>
        </Box>

        {/* Global Control Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<PinIcon sx={{ fontSize: 16 }} />}
            onClick={handleOpenLocationSettings}
            fullWidth
            sx={{
              width: { sm: 'auto' },
              textTransform: 'none',
              borderRadius: 2.5,
              px: 3,
              py: 1.1,
              fontFamily: 'Outfit',
              fontSize: '12.5px',
              borderColor: '#cbd5e1',
              color: '#334155',
              fontWeight: 700,
              backgroundColor: '#fff',
              '&:hover': {
                borderColor: '#94a3b8',
                backgroundColor: '#f8fafc',
              },
            }}
          >
            Office Geofence Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<QrCodeIcon sx={{ fontSize: 16 }} />}
            onClick={handleGenerateQr}
            fullWidth
            sx={{
              width: { sm: 'auto' },
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              textTransform: 'none',
              borderRadius: 2.5,
              px: 3,
              py: 1.1,
              fontFamily: 'Outfit',
              fontSize: '12.5px',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                boxShadow: 'none',
              },
            }}
          >
            Generate Attendance QR
          </Button>
        </Box>
      </Box>

      {/* 2. System Status Bar */}
      <Card sx={{ 
        mb: 4, 
        borderRadius: 3, 
        bgcolor: '#f8fafc', 
        border: '1px solid #f1f5f9', 
        p: '10px 20px', 
        boxShadow: 'none'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LiveIcon sx={{ color: '#10b981', fontSize: 16 }} />
            <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Inter', fontWeight: 600 }}>
              System Status: <span style={{ color: '#16a34a' }}>OPERATIONAL</span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Typography sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 0.6 }}>
              🟢 Biometrics Engine: <strong>ONLINE</strong>
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 0.6 }}>
              🗺️ Geofence Boundaries: <strong>ACTIVE</strong>
            </Typography>
          </Box>
        </Box>
      </Card>

      {loading && !stats ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          {/* 3. Executive KPI Stats Cards Grid (Premium Stripe/SaaS Design) */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)', // 2 columns on mobile
              sm: 'repeat(3, 1fr)', // 3 columns on tablet
              md: 'repeat(5, 1fr)', // 5 columns on desktop
            },
            gap: 2.5,
            mb: 4
          }}>
            {statCards.map((card, index) => (
              <Card 
                key={card.title}
                onClick={() => card.path && navigate(card.path)}
                sx={{ 
                  borderRadius: 3.5, 
                  bgcolor: '#fff',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: card.path ? 'pointer' : 'default',
                  gridColumn: { 
                    xs: index === 4 ? 'span 2' : 'span 1', 
                    sm: 'span 1' 
                  },
                  '&:hover': {
                    transform: 'translateY(-2.5px)',
                    borderColor: '#cbd5e1',
                    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.06), 0 4px 12px -2px rgba(0,0,0,0.03)',
                  }
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.8 }}>
                    <Box sx={{ p: 0.6, borderRadius: 2, bgcolor: card.badge.bg, display: 'flex', color: card.badge.color }}>
                      {card.icon}
                    </Box>
                    <Chip 
                      label={card.badge.label} 
                      size="small" 
                      sx={{ 
                        bgcolor: card.badge.bg, 
                        color: card.badge.color, 
                        fontSize: '9.5px', 
                        fontWeight: 'bold', 
                        height: 18,
                        fontFamily: 'Outfit'
                      }} 
                    />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: '800', color: '#0f172a', fontSize: { xs: '22px', sm: '30px' }, fontFamily: 'Outfit', lineHeight: 1.1 }}>
                    {card.value}
                  </Typography>
                  
                  <Divider sx={{ my: 1.5, borderColor: '#f8fafc' }} />
                  
                  <Typography sx={{ color: '#475569', fontWeight: '700', fontSize: '11.5px', fontFamily: 'Outfit' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'Inter', fontSize: '10.5px', mt: 0.2, display: 'block' }}>
                    {card.indicator}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* 4. Core Control Center & Analytics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            
            {/* Left Column: Weekly Analytics Chart */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ 
                borderRadius: 4, 
                p: { xs: 2.5, sm: 3.5 }, 
                bgcolor: '#fff', 
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)',
                height: '100%'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb', display: 'flex' }}>
                      <TrendsIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a', fontFamily: 'Outfit', fontSize: '16px' }}>
                        Weekly Attendance Analytics
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'Inter', display: 'block' }}>
                        Visual representation of daily check-ins and late occurrences
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ height: 320, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 10, fontFamily: 'Inter', fontWeight: 500 }} />
                      <YAxis stroke="#94a3b8" style={{ fontSize: 10, fontFamily: 'Inter', fontWeight: 500 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontFamily: 'Outfit', fontSize: '12px', marginTop: '15px', fontWeight: 600 }} />
                      <Area type="monotone" name="Present Count" dataKey="present" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresent)" />
                      <Area type="monotone" name="Late Arrivals" dataKey="late" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLate)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>

            {/* Right Column: Quick Action Radar Control Center (Professional Cards) */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                
                {/* Geofence Radar Card */}
                <Card sx={{ 
                  borderRadius: 4, 
                  p: 3, 
                  bgcolor: '#fff', 
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)',
                  flex: 1
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0f172a', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapIcon sx={{ color: '#2563eb', fontSize: 18 }} /> Active Geofence Radar
                    </Typography>
                    <Chip label="Guarded" size="small" sx={{ bgcolor: '#ecfdf5', color: '#047857', fontSize: '9px', fontWeight: 'bold', height: 18, fontFamily: 'Outfit' }} />
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: '#f8fafc' }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter' }}>Latitude</Typography>
                      <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', fontFamily: 'Outfit' }}>
                        {formatCoordinate(locLatitude)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter' }}>Longitude</Typography>
                      <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', fontFamily: 'Outfit' }}>
                        {formatCoordinate(locLongitude)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter' }}>Allowed Radius</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#166534', fontFamily: 'Outfit', bgcolor: '#dcfce7', px: 1, py: 0.2, borderRadius: '6px' }}>
                        {formatRadius(locRadius)}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PinIcon sx={{ fontSize: 15 }} />}
                    onClick={handleOpenLocationSettings}
                    sx={{
                      py: 1,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontFamily: 'Outfit',
                      fontWeight: 700,
                      fontSize: '12px',
                      borderColor: '#cbd5e1',
                      color: '#475569',
                      '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
                    }}
                  >
                    Adjust Boundary Coordinates
                  </Button>
                </Card>

                {/* QR Terminal Session Card */}
                <Card sx={{ 
                  borderRadius: 4, 
                  p: 3, 
                  bgcolor: '#fff', 
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)',
                  flex: 1
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0f172a', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QrCodeIcon sx={{ color: '#7e22ce', fontSize: 18 }} /> QR Check-In Terminal
                    </Typography>
                    <Chip label="Encrypted" size="small" sx={{ bgcolor: '#faf5ff', color: '#701a75', fontSize: '9px', fontWeight: 'bold', height: 18, fontFamily: 'Outfit' }} />
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: '#f8fafc' }} />
                  
                  <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '12px', mb: 2.5, lineHeight: 1.5 }}>
                    Generate a secure, single-day biometric QR code that employees scan using their mobile dashboards to verify their office check-ins.
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<QrCodeIcon sx={{ fontSize: 15 }} />}
                    onClick={handleGenerateQr}
                    sx={{
                      py: 1,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontFamily: 'Outfit',
                      fontWeight: 700,
                      fontSize: '12px',
                      background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                      boxShadow: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #6b21a8 0%, #581c87 100%)',
                        boxShadow: 'none',
                      }
                    }}
                  >
                    Launch Daily QR Session
                  </Button>
                </Card>

              </Box>
            </Grid>

          </Grid>
        </>
      )}

      {/* 5. SECURE QR CODE TERMINAL DIALOG (Redesigned & Working!) */}
      <Dialog 
        open={qrOpen} 
        onClose={handleCloseQr} 
        maxWidth="xs" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, p: 1.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', pb: 1, fontFamily: 'Outfit', fontSize: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: '800', fontFamily: 'Outfit', fontSize: '17px', color: '#0f172a' }}>
            Daily Attendance Terminal
          </Typography>
          <IconButton onClick={handleCloseQr} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
          {qrLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
              <CircularProgress size={36} color="secondary" />
              <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter', fontWeight: 500 }}>
                Generating secure attendance token...
              </Typography>
            </Box>
          ) : qrCodeUrl ? (
            <>
              {/* Secure QR Frame */}
              <Box
                component="img"
                src={qrCodeUrl}
                alt="Daily QR Code"
                sx={{ 
                  width: 240, 
                  height: 240, 
                  borderRadius: 3, 
                  border: '1px solid #e2e8f0', 
                  p: 2, 
                  bgcolor: '#fff',
                  boxShadow: '0 8px 30px rgba(148, 163, 184, 0.08)' 
                }}
              />
              
              <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: 2, px: 1.8, py: 0.6 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', animation: 'pulse 1.5s infinite' }} />
                <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#065f46', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Secure Session Active
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#64748b', mt: 2, textAlign: 'center', fontFamily: 'Inter', fontSize: '12px', px: 1, lineHeight: 1.5 }}>
                Employees can scan this code from their mobile dashboards to record instant geofenced check-ins.
              </Typography>
              
              <Typography variant="caption" sx={{ color: '#b91c1c', mt: 2, fontWeight: 700, fontFamily: 'Inter', display: 'block', textAlign: 'center', bgcolor: '#fef2f2', px: 1.5, py: 0.4, borderRadius: '6px' }}>
                ⚠️ Session automatically invalidates at midnight
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="error" sx={{ fontFamily: 'Inter', py: 4 }}>
              Failed to acquire secure session token. Please verify backend connection.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pt: 2, pb: 1 }}>
          <Button 
            onClick={handleCloseQr} 
            variant="outlined" 
            sx={{ 
              borderRadius: 2.5, 
              textTransform: 'none', 
              px: 4, 
              borderColor: '#cbd5e1', 
              color: '#475569',
              fontFamily: 'Outfit',
              fontWeight: 700,
              fontSize: '12px',
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
            }}
          >
            Close Terminal
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. OFFICE GEOFENCE SETTINGS DIALOG (Redesigned & Beautiful!) */}
      <Dialog 
        open={locationOpen} 
        onClose={() => setLocationOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, p: 1.5 } }}
      >
        <form onSubmit={handleSaveLocationSettings}>
          <DialogTitle sx={{ fontWeight: 'bold', pb: 1, fontFamily: 'Outfit', fontSize: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: '800', fontFamily: 'Outfit', fontSize: '17px', color: '#0f172a' }}>
              Configure Geofence Boundary
            </Typography>
            <IconButton onClick={() => setLocationOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2.5, borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3, fontFamily: 'Inter', fontSize: '12.5px', lineHeight: 1.5 }}>
              Set the precise center latitude, longitude, and allowed radius boundary (in meters) for employee clock-ins.
            </Typography>

            {locError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5, fontSize: '12px' }}>
                {locError}
              </Alert>
            )}

            {locSuccess && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5, fontSize: '12px' }}>
                {locSuccess}
              </Alert>
            )}

            {/* Futuristic Geofence Summary Visualizer */}
            <Box sx={{ 
              mb: 3, 
              p: 2.2, 
              borderRadius: 3, 
              bgcolor: '#0f172a', 
              color: '#fff', 
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                position: 'absolute',
                width: 150,
                height: 150,
                borderRadius: '50%',
                border: '1px dashed rgba(16, 185, 129, 0.3)',
                top: -40,
                right: -40,
                animation: 'pulse-slow 4s infinite'
              }} />
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1, fontFamily: 'Outfit' }}>
                📡 Active Radar Coordinates
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'Inter' }}>Latitude</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'Outfit', color: '#f8fafc' }}>
                    {formatCoordinate(locLatitude)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'Inter' }}>Longitude</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'Outfit', color: '#f8fafc' }}>
                    {formatCoordinate(locLongitude)}
                  </Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.08)' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'Inter' }}>Allowed Boundary Radius</Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'Outfit', color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.15)', px: 1.2, py: 0.3, borderRadius: '8px' }}>
                  {formatRadius(locRadius)}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Office Latitude"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={locLatitude}
                  onChange={(e) => setLocLatitude(e.target.value)}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Office Longitude"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={locLongitude}
                  onChange={(e) => setLocLongitude(e.target.value)}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Allowed Radius Boundary (Meters)"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={locRadius}
                  onChange={(e) => setLocRadius(e.target.value)}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                variant="outlined"
                startIcon={<DetectIcon sx={{ fontSize: 16 }} />}
                onClick={handleDetectCurrentLocation}
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: 2.5, 
                  fontFamily: 'Outfit',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': {
                    borderColor: '#94a3b8',
                    backgroundColor: '#f8fafc',
                  }
                }}
              >
                Acquire Current GPS Coordinates
              </Button>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pt: 2, pb: 1, gap: 1 }}>
            <Button 
              onClick={() => setLocationOpen(false)} 
              variant="outlined" 
              sx={{ 
                borderRadius: 2.5, 
                textTransform: 'none', 
                px: 3,
                fontFamily: 'Outfit',
                fontWeight: 700,
                fontSize: '12px',
                borderColor: '#cbd5e1',
                color: '#64748b'
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={locSaving}
              variant="contained"
              sx={{ 
                borderRadius: 2.5, 
                textTransform: 'none', 
                px: 3,
                fontFamily: 'Outfit',
                fontWeight: 700,
                fontSize: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                  boxShadow: 'none',
                }
              }}
            >
              {locSaving ? <CircularProgress size={18} color="inherit" /> : 'Save Geofence'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDashboard;
