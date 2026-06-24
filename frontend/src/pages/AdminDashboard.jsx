import React, { useState, useEffect } from 'react';
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
  TrendingUp as UpIcon,
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
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // QR Dialog state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrToken, setQrToken] = useState('');
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
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await API.get('/dashboard/admin/stats');
      const chartsRes = await API.get('/dashboard/admin/charts');
      setStats(statsRes.data);
      setChartData(chartsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLocationSettings = async () => {
    setLocError('');
    setLocSuccess('');
    setLocationOpen(true);
    try {
      const res = await API.get('/attendance/office-location');
      setLocLatitude(res.data.latitude || '');
      setLocLongitude(res.data.longitude || '');
      setLocRadius(res.data.radiusMeters || '');
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
      setLocLatitude(res.data.latitude);
      setLocLongitude(res.data.longitude);
      setLocRadius(res.data.radiusMeters);
      
      // Refresh stats in case location updates affect live tracking
      const statsRes = await API.get('/dashboard/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to save geofence location settings", err);
      setLocError(err.response?.data?.message || err.message || "Failed to update settings.");
    } finally {
      setLocSaving(false);
    }
  };

  const handleGenerateQr = async () => {
    setQrLoading(true);
    setQrOpen(true);
    try {
      const res = await API.get('/attendance/generate-qr');
      setQrToken(res.data.token);
    } catch (err) {
      console.error("Failed to generate QR token", err);
    } finally {
      setQrLoading(false);
    }
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

  const statCards = stats
    ? [
        {
          title: 'Total Employees',
          value: stats.totalEmployees,
          indicator: 'Registered staff',
          icon: <PeopleIcon sx={{ fontSize: 20, color: '#2563eb' }} />,
          bg: '#eff6ff',
          borderColor: '#2563eb',
        },
        {
          title: 'Present Today',
          value: stats.presentToday,
          indicator: `${stats.attendancePercentage > 0 ? '+' : ''}${(stats.attendancePercentage).toFixed(0)}% checked-in`,
          icon: <PresentIcon sx={{ fontSize: 20, color: '#16a34a' }} />,
          bg: '#f0fdf4',
          borderColor: '#16a34a',
        },
        {
          title: 'Absent Today',
          value: stats.absentToday,
          indicator: 'Awaiting punch-in',
          icon: <AbsentIcon sx={{ fontSize: 20, color: '#dc2626' }} />,
          bg: '#fef2f2',
          borderColor: '#dc2626',
        },
        {
          title: 'Late Arrivals',
          value: stats.lateArrivals,
          indicator: 'Punched after 9:15 AM',
          icon: <LateIcon sx={{ fontSize: 20, color: '#d97706' }} />,
          bg: '#fffbeb',
          borderColor: '#d97706',
        },
        {
          title: 'Attendance %',
          value: `${stats.attendancePercentage.toFixed(1)}%`,
          indicator: 'Daily presence rate',
          icon: <PercentIcon sx={{ fontSize: 20, color: '#7e22ce' }} />,
          bg: '#faf5ff',
          borderColor: '#7e22ce',
        },
      ]
    : [];

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
            <Box sx={{ p: 0.6, borderRadius: 2, bgcolor: '#e0e7ff', color: '#4f46e5', display: 'flex' }}>
              <ShieldIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: '800', color: '#1e293b', fontFamily: 'Outfit', letterSpacing: '0.2px', fontSize: { xs: '20px', sm: '26px' } }}>
              Operations Control Center
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '13px', fontWeight: 500 }}>
              {formattedDateString}
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#cbd5e1', display: { xs: 'none', sm: 'block' } }} />
            <Typography variant="body2" sx={{ color: '#4f46e5', fontFamily: 'Outfit', fontSize: '13.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.8 }}>
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
              borderRadius: 3,
              px: 3,
              py: 1.2,
              fontFamily: 'Outfit',
              fontSize: '12.5px',
              borderColor: '#cbd5e1',
              color: '#334155',
              fontWeight: 700,
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
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
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              textTransform: 'none',
              borderRadius: 3,
              px: 3,
              py: 1.2,
              fontFamily: 'Outfit',
              fontSize: '12.5px',
              fontWeight: 700,
              boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)',
                boxShadow: '0 6px 20px 0 rgba(79, 70, 229, 0.35)',
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
        border: '1px solid #e2e8f0', 
        p: '10px 20px', 
        boxShadow: 'none'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LiveIcon sx={{ color: '#10b981', fontSize: 16, animation: 'pulse-slow 2s infinite' }} />
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          {/* 3. Executive KPI Stats Cards Grid (Responsive reflow) */}
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
                sx={{ 
                  borderRadius: 3.5, 
                  bgcolor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderTop: `4px solid ${card.borderColor}`,
                  boxShadow: '0 4px 12px rgba(148, 163, 184, 0.03)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  // Make the 5th card (Attendance %) span full row on mobile if it wraps
                  gridColumn: { 
                    xs: index === 4 ? 'span 2' : 'span 1', 
                    sm: 'span 1' 
                  },
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 10px 24px rgba(148, 163, 184, 0.12)',
                  }
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography sx={{ color: '#64748b', fontWeight: '700', fontSize: '12px', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {card.title}
                    </Typography>
                    <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: card.bg, display: 'flex' }}>
                      {card.icon}
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: '800', color: '#1e293b', fontSize: { xs: '22px', sm: '28px' }, fontFamily: 'Outfit', lineHeight: 1.1 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'Inter', fontSize: '11px', mt: 0.8, display: 'block', fontWeight: 500 }}>
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
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(148, 163, 184, 0.03)',
                height: '100%'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#e0e7ff', color: '#4f46e5', display: 'flex' }}>
                      <TrendsIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: '16.5px' }}>
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

            {/* Right Column: Quick Action Radar Control Center */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                
                {/* Geofence Radar Card */}
                <Card sx={{ 
                  borderRadius: 4, 
                  p: 3, 
                  bgcolor: '#fff', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(148, 163, 184, 0.03)',
                  flex: 1
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MapIcon sx={{ color: '#2563eb', fontSize: 18 }} /> Active Geofence Radar
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '12.5px', color: '#64748b', fontFamily: 'Inter' }}>Latitude</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#334155', fontFamily: 'Outfit' }}>
                        {locLatitude ? Number(locLatitude).toFixed(6) : '40.712800'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '12.5px', color: '#64748b', fontFamily: 'Inter' }}>Longitude</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#334155', fontFamily: 'Outfit' }}>
                        {locLongitude ? Number(locLongitude).toFixed(6) : '-74.006000'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '12.5px', color: '#64748b', fontFamily: 'Inter' }}>Radius Boundary</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#15803d', fontFamily: 'Outfit', bgcolor: '#dcfce7', px: 1.2, py: 0.3, borderRadius: '8px' }}>
                        {locRadius ? `${locRadius} meters` : '200 meters'}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DetectIcon sx={{ fontSize: 15 }} />}
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
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(148, 163, 184, 0.03)',
                  flex: 1
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QrCodeIcon sx={{ color: '#7e22ce', fontSize: 18 }} /> QR Check-In Terminal
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '12.5px', mb: 3, lineHeight: 1.5 }}>
                    Generate a secure, single-day biometric QR code that employees scan using their mobile dashboards to verify their office check-ins.
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<QrCodeIcon sx={{ fontSize: 15 }} />}
                    onClick={handleGenerateQr}
                    sx={{
                      py: 1.2,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontFamily: 'Outfit',
                      fontWeight: 700,
                      fontSize: '12px',
                      background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                      boxShadow: '0 4px 12px 0 rgba(126, 34, 206, 0.2)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #6b21a8 0%, #581c87 100%)',
                        boxShadow: '0 6px 16px 0 rgba(126, 34, 206, 0.3)',
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

      {/* 5. QR Code Dialog */}
      <Dialog 
        open={qrOpen} 
        onClose={() => setQrOpen(false)} 
        maxWidth="xs" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', pb: 1, fontFamily: 'Outfit', fontSize: '18px' }}>
          Daily Attendance QR Terminal
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          {qrLoading ? (
            <CircularProgress color="primary" />
          ) : qrToken ? (
            <>
              <Box
                component="img"
                src={`${API.defaults.baseURL || ''}/attendance/qr-code/${qrToken}`}
                alt="Daily QR Code"
                sx={{ 
                  width: 240, 
                  height: 240, 
                  borderRadius: 3, 
                  border: '1px solid #cbd5e1', 
                  p: 1.5, 
                  bgcolor: '#fff',
                  boxShadow: '0 8px 24px rgba(148, 163, 184, 0.1)' 
                }}
              />
              <Typography variant="body2" sx={{ color: '#64748b', mt: 2.5, textAlign: 'center', fontFamily: 'Inter', fontSize: '12.5px', px: 1, lineHeight: 1.5 }}>
                Have employees scan this token from their mobile dashboards to record instant geofenced check-ins.
              </Typography>
              <Box sx={{ mt: 2, bgcolor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 2.5, px: 2, py: 1 }}>
                <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 'bold', fontFamily: 'Inter', display: 'block', textAlign: 'center' }}>
                  ⚠️ Session valid for today only
                </Typography>
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="error" sx={{ fontFamily: 'Inter' }}>
              Failed to generate QR Code.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={() => setQrOpen(false)} 
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

      {/* 6. Geofence Location Settings Dialog */}
      <Dialog 
        open={locationOpen} 
        onClose={() => setLocationOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, p: 1 } }}
      >
        <form onSubmit={handleSaveLocationSettings}>
          <DialogTitle sx={{ fontWeight: 'bold', pb: 1, fontFamily: 'Outfit', fontSize: '18px' }}>
            Office Geofencing Coordinates
          </DialogTitle>
          <DialogContent sx={{ py: 2 }}>
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                Use My Current Location
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
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
              variant="contained"
              disabled={locSaving}
              sx={{ 
                borderRadius: 2.5, 
                textTransform: 'none', 
                px: 3,
                fontFamily: 'Outfit',
                fontWeight: 700,
                fontSize: '12px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)',
                  boxShadow: '0 6px 18px rgba(79, 70, 229, 0.3)',
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
