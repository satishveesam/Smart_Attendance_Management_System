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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip as MuiTooltip,
  Avatar,
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
  Close as CloseIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  AccessTime as TimeIcon,
  Event as DateIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);
  
  // Card click details dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogTitle, setDetailsDialogTitle] = useState('');
  const [detailsDialogData, setDetailsDialogData] = useState([]);
  const [detailsType, setDetailsType] = useState(''); // 'employees' | 'present' | 'absent' | 'late' | 'percentage'
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [dialogSearch, setDialogSearch] = useState('');

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    try {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return '—';
    }
  };

  const handleCardClick = async (title) => {
    setDetailsDialogTitle(title);
    setDetailsDialogOpen(true);
    setDetailsLoading(true);
    setDialogSearch('');
    try {
      if (title === 'Total Employees') {
        setDetailsType('employees');
        const res = await API.get('/employees');
        setDetailsDialogData(res.data);
      } else if (title === 'Present Today') {
        setDetailsType('present');
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const res = await API.get(`/reports?startDate=${todayStr}&endDate=${todayStr}`);
        setDetailsDialogData(res.data);
      } else if (title === 'Absent Today') {
        setDetailsType('absent');
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const [empRes, logsRes] = await Promise.all([
          API.get('/employees'),
          API.get(`/reports?startDate=${todayStr}&endDate=${todayStr}`)
        ]);
        const presentIds = new Set(logsRes.data.map(log => log.employeeId));
        const absentEmployees = empRes.data.filter(emp => !presentIds.has(emp.id));
        setDetailsDialogData(absentEmployees);
      } else if (title === 'Late Arrivals') {
        setDetailsType('late');
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const res = await API.get(`/reports?startDate=${todayStr}&endDate=${todayStr}`);
        const lateLogs = res.data.filter(log => log.status === 'LATE');
        setDetailsDialogData(lateLogs);
      } else if (title === 'Attendance %') {
        setDetailsType('percentage');
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const [empRes, logsRes] = await Promise.all([
          API.get('/employees'),
          API.get(`/reports?startDate=${todayStr}&endDate=${todayStr}`)
        ]);
        const presentCount = logsRes.data.length;
        const totalCount = empRes.data.length;
        const absentCount = totalCount - presentCount;
        const lateCount = logsRes.data.filter(log => log.status === 'LATE').length;
        
        setDetailsDialogData({
          total: totalCount,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          percentage: totalCount > 0 ? (presentCount / totalCount) * 100 : 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch details for " + title, err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredData = Array.isArray(detailsDialogData)
    ? detailsDialogData.filter(item => {
        if (!dialogSearch) return true;
        const searchLower = dialogSearch.toLowerCase();
        const code = (item.employeeCode || '').toLowerCase();
        const name = (item.firstName ? `${item.firstName} ${item.lastName}` : item.employeeName || '').toLowerCase();
        const dept = (item.department || '').toLowerCase();
        const email = (item.email || '').toLowerCase();
        return code.includes(searchLower) || name.includes(searchLower) || dept.includes(searchLower) || email.includes(searchLower);
      })
    : [];

  // QR Dialog state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Geofence Location Settings state
  const [locationOpen, setLocationOpen] = useState(false);
  const [locLatitude, setLocLatitude] = useState('');
  const [locLongitude, setLocLongitude] = useState('');
  const [locRadius, setLocRadius] = useState('');
  const [locSaving, setLocSaving] = useState(false);
  const [locError, setLocError] = useState('');
  const [locSuccess, setLocSuccess] = useState('');

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
    } catch (err) {
      console.error("Failed to save geofence location settings", err);
      setLocError(err.response?.data?.message || err.message || "Failed to update settings.");
    } finally {
      setLocSaving(false);
    }
  };

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

      // Fetch office location coordinates for geofencing status widget
      try {
        const locRes = await API.get('/attendance/office-location');
        setLocLatitude(locRes.data.latitude || '');
        setLocLongitude(locRes.data.longitude || '');
        setLocRadius(locRes.data.radiusMeters || '');
      } catch (locErr) {
        console.error("Failed to load geofencing settings in background", locErr);
      }

      // Fetch today's logs for recent activities feed
      const todayStr = new Date().toLocaleDateString('sv-SE');
      const logsRes = await API.get(`/reports?startDate=${todayStr}&endDate=${todayStr}`);
      const sortedLogs = (logsRes.data || [])
        .sort((a, b) => new Date(b.checkIn || b.attendanceDate) - new Date(a.checkIn || a.attendanceDate))
        .slice(0, 4);
      setRecentLogs(sortedLogs);
    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup QR Code URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [qrCodeUrl]);

  const handleGenerateQr = async () => {
    setQrLoading(true);
    setQrOpen(true);
    try {
      const res = await API.get('/attendance/generate-qr');
      const token = res.data.token;
      setQrToken(token);

      // Fetch the QR image using API to pass JWT Authorization header
      const imgRes = await API.get(`/attendance/qr-code/${token}`, {
        responseType: 'blob'
      });
      const imageUrl = URL.createObjectURL(imgRes.data);
      setQrCodeUrl(imageUrl);
    } catch (err) {
      console.error("Failed to generate QR token or load QR image", err);
    } finally {
      setQrLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          title: 'Total Employees',
          value: stats.totalEmployees,
          icon: <PeopleIcon sx={{ fontSize: 22, color: '#0284c7' }} />,
          bg: '#e0f2fe',
          themeColor: '#0284c7',
        },
        {
          title: 'Present Today',
          value: stats.presentToday,
          icon: <PresentIcon sx={{ fontSize: 22, color: '#10b981' }} />,
          bg: '#d1fae5',
          themeColor: '#10b981',
        },
        {
          title: 'Absent Today',
          value: stats.absentToday,
          icon: <AbsentIcon sx={{ fontSize: 22, color: '#ef4444' }} />,
          bg: '#fee2e2',
          themeColor: '#ef4444',
        },
        {
          title: 'Late Arrivals',
          value: stats.lateArrivals,
          icon: <LateIcon sx={{ fontSize: 22, color: '#f59e0b' }} />,
          bg: '#fef3c7',
          themeColor: '#f59e0b',
        },
        {
          title: 'Attendance %',
          value: `${stats.attendancePercentage.toFixed(1)}%`,
          icon: <PercentIcon sx={{ fontSize: 22, color: '#8b5cf6' }} />,
          bg: '#ede9fe',
          themeColor: '#8b5cf6',
        },
      ]
    : [];

  return (
    <AdminLayout>
      {/* Premium Hero Welcome Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 1.5, sm: 4 }, 
          mb: 2.5, 
          borderRadius: 4, 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background gradients */}
        <Box sx={{ position: 'absolute', top: '-50%', right: '-20%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0) 70%)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '-40%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0) 70%)', zIndex: 0 }} />

        <Grid container spacing={{ xs: 1.5, sm: 3 }} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip 
                label="Operational Control Active" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(16, 185, 129, 0.15)', 
                  color: '#34d399', 
                  fontWeight: 'bold', 
                  fontFamily: 'Inter',
                  fontSize: { xs: '8px', sm: '11px' },
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  height: { xs: 18, sm: 24 },
                  '& .MuiChip-label': { px: 1 }
                }} 
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.5px', fontSize: { xs: '18px', sm: '32px' } }}>
              SmartAttendance Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, fontFamily: 'Inter', maxWidth: '600px', fontSize: '13px', lineHeight: 1.6, display: { xs: 'none', sm: 'block' } }}>
              Monitor real-time biometric and location check-ins, manage geofencing coordinates, and export audit trails for your workforce.
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
                 {/* Quick Actions Panel */}
          <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon sx={{ fontSize: 16 }} />}
              onClick={handleOpenLocationSettings}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                textTransform: 'none',
                borderRadius: 3,
                px: 3,
                py: 1.2,
                fontFamily: 'Outfit',
                fontSize: '12.5px',
                borderColor: '#e2e8f0',
                color: '#334155',
                fontWeight: 600,
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc',
                },
              }}
            >
              Configure Geofencing
            </Button>
            <Button
              variant="contained"
              startIcon={<QrCodeIcon sx={{ fontSize: 16 }} />}
              onClick={handleGenerateQr}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                textTransform: 'none',
                borderRadius: 3,
                px: 3,
                py: 1.2,
                fontFamily: 'Outfit',
                fontSize: '12.5px',
                fontWeight: 600,
                boxShadow: '0 4px 14px 0 rgba(2, 132, 199, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
                  boxShadow: '0 6px 18px 0 rgba(2, 132, 199, 0.3)',
                },
              }}
            >
              Generate Attendance QR
            </Button>
          </Box>

          {/* Stats Cards Row */}
          <Grid container spacing={1.5} sx={{ mb: 4 }}>
            {statCards.map((card, index) => (
              <Grid item xs={4} sm={4} md={2.4} key={card.title}>
                <Card 
                  onClick={() => handleCardClick(card.title)}
                  sx={{ 
                    height: '100%', 
                    borderRadius: 3, 
                    bgcolor: card.bg || '#fff',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px -4px ${card.themeColor}40`,
                      filter: 'brightness(0.98)'
                    }
                  }}
                >
                  <CardContent sx={{ p: { xs: 0.8, sm: 2.2 }, '&:last-child': { pb: { xs: 0.8, sm: 2.2 } } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 0.6, sm: 1.2 } }}>
                      <Typography variant="body2" sx={{ color: card.themeColor, fontWeight: '700', fontSize: { xs: '6.8px', sm: '12px' }, fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: '0.3px', opacity: 0.85 }}>
                        {card.title}
                      </Typography>
                      <Box sx={{ width: { xs: 18, sm: 36 }, height: { xs: 18, sm: 36 }, borderRadius: 1.5, bgcolor: 'rgba(255, 255, 255, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { fontSize: { xs: 11, sm: 20 }, color: card.themeColor } }}>
                        {card.icon}
                      </Box>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: '800', color: '#0f172a', fontSize: { xs: '13px', sm: '26px' }, fontFamily: 'Outfit', mb: 0.5 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: card.themeColor, fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: { xs: '6px', sm: '11px' }, opacity: 0.85 }}>
                      <Box component="span" sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: card.themeColor }} />
                      Click to audit
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Main Content Grid: Charts + Side Utilities */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Chart Area */}
            <Grid item xs={12} md={8}>
              <Card 
                sx={{ 
                  borderRadius: 4.5, 
                  p: { xs: 2, sm: 3 }, 
                  bgcolor: '#fff', 
                  border: '1px solid #f1f5f9',
                  height: '100%',
                  boxShadow: '0 4px 20px -2px rgba(50, 50, 93, 0.02), 0 2px 8px -1px rgba(0, 0, 0, 0.01)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a', fontFamily: 'Outfit', fontSize: '16.5px' }}>
                      Weekly Attendance Analytics
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'Inter', display: 'block', mt: 0.2 }}>
                      Daily tracking showing present counts against late occurrences
                    </Typography>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 10.5, fontFamily: 'Inter' }} />
                      <YAxis stroke="#94a3b8" style={{ fontSize: 10.5, fontFamily: 'Inter' }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: 8, 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                          fontFamily: 'Inter',
                          fontSize: '12px'
                        }} 
                      />
                      <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: '11.5px', marginTop: '10px' }} />
                      <Area type="monotone" name="Present Count" dataKey="present" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresent)" />
                      <Area type="monotone" name="Late Arrivals" dataKey="late" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLate)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>

            {/* Sidebar widgets */}
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Geofence Status Widget */}
              <Card 
                sx={{ 
                  borderRadius: 4.5, 
                  p: 2.5, 
                  bgcolor: '#fff', 
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 20px -2px rgba(50, 50, 93, 0.02), 0 2px 8px -1px rgba(0, 0, 0, 0.01)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(2, 132, 199, 0.08)', color: '#0284c7', display: 'flex' }}>
                    <PinIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', color: '#0f172a', fontSize: '14.5px' }}>
                    Office Geofence Status
                  </Typography>
                </Box>
                
                {locLatitude && locLongitude ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px dashed #f1f5f9' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter' }}>Latitude</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', fontFamily: 'Inter' }}>{parseFloat(locLatitude).toFixed(6)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px dashed #f1f5f9' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter' }}>Longitude</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', fontFamily: 'Inter' }}>{parseFloat(locLongitude).toFixed(6)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px dashed #f1f5f9' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter' }}>Allowed Radius</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#0284c7', fontFamily: 'Inter' }}>{locRadius} meters</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontFamily: 'Inter', my: 1 }}>
                    No geofence coordinates configured.
                  </Typography>
                )}

                <Button 
                  fullWidth
                  variant="text"
                  onClick={handleOpenLocationSettings}
                  sx={{ textTransform: 'none', mt: 2, fontSize: '12px', fontFamily: 'Outfit', fontWeight: 600, color: '#0284c7' }}
                >
                  Modify coordinates settings &rarr;
                </Button>
              </Card>

              {/* Live Operational Feed widget */}
              <Card 
                sx={{ 
                  borderRadius: 4.5, 
                  p: 2.5, 
                  bgcolor: '#fff', 
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 20px -2px rgba(50, 50, 93, 0.02), 0 2px 8px -1px rgba(0, 0, 0, 0.01)',
                  flexGrow: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#10b981', display: 'flex' }}>
                      <DetectIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', color: '#0f172a', fontSize: '14.5px' }}>
                      Live Activity Feed
                    </Typography>
                  </Box>
                  {/* Pulsing indicator */}
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: '#10b981', 
                      boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)',
                      animation: 'pulse 1.8s infinite'
                    }} 
                  />
                </Box>

                {recentLogs && recentLogs.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {recentLogs.map((log, idx) => (
                      <Box key={log.id || idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: log.status === 'LATE' ? '#f59e0b' : '#10b981', fontSize: '11.5px', fontFamily: 'Outfit', fontWeight: 'bold' }}>
                          {log.employeeName ? log.employeeName[0].toUpperCase() : 'E'}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography noWrap sx={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit' }}>
                            {log.employeeName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'Inter', display: 'block' }}>
                            Checked In: {formatTime(log.checkIn)} ({log.checkInLocationType || 'Office'})
                          </Typography>
                        </Box>
                        <Chip 
                          label={log.status === 'LATE' ? 'Late' : 'Present'} 
                          size="small" 
                          color={log.status === 'LATE' ? 'warning' : 'success'} 
                          sx={{ 
                            height: 18, 
                            fontSize: '9px', 
                            fontWeight: 'bold', 
                            fontFamily: 'Inter',
                            borderRadius: 1
                          }} 
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontFamily: 'Inter', fontSize: '12px' }}>
                      Waiting for today's logs...
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
          
          {/* Keyframe animations */}
          <style>
            {`
              @keyframes pulse {
                0% {
                  transform: scale(0.95);
                  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                }
                70% {
                  transform: scale(1);
                  box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
                }
                100% {
                  transform: scale(0.95);
                  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                }
              }
            `}
          </style>
        </>
      )}

      {/* QR Code Dialog */}
      <Dialog 
        open={qrOpen} 
        onClose={() => setQrOpen(false)} 
        maxWidth="xs" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', pb: 1, fontFamily: 'Outfit' }}>
          Daily Attendance QR Code
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          {qrLoading ? (
            <CircularProgress color="primary" />
          ) : qrToken ? (
            <>
              <Box
                component="img"
                src={qrCodeUrl}
                alt="Daily QR Code"
                sx={{ 
                  width: 250, 
                  height: 250, 
                  borderRadius: 3, 
                  border: '1px solid #e2e8f0', 
                  p: 1.5, 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)' 
                }}
              />
              <Typography variant="body2" sx={{ color: '#64748b', mt: 2.5, textAlign: 'center', fontFamily: 'Inter', fontSize: '12.5px' }}>
                Employees can scan this QR code using the check-in panel on their mobile devices.
              </Typography>
              <Typography variant="caption" sx={{ color: '#ef4444', mt: 1.5, fontWeight: 'bold', fontFamily: 'Inter' }}>
                Note: This QR code session is valid for today only.
              </Typography>
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
              borderRadius: 2, 
              textTransform: 'none', 
              px: 4, 
              borderColor: '#cbd5e1', 
              color: '#334155',
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: '12.5px'
            }}
          >
            Close Dialog
          </Button>
        </DialogActions>
      </Dialog>

      {/* Geofence Location Settings Dialog */}
      <Dialog 
        open={locationOpen} 
        onClose={() => setLocationOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: 3.5, p: 1 } }}
      >
        <form onSubmit={handleSaveLocationSettings}>
          <DialogTitle sx={{ fontWeight: 'bold', pb: 1, fontFamily: 'Outfit' }}>
            Work Location & Geofencing Settings
          </DialogTitle>
          <DialogContent sx={{ py: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3, fontFamily: 'Inter', fontSize: '12.5px' }}>
              Configure the primary coordinates (latitude and longitude) and allowed geofence boundary radius (in meters) for employee check-ins/check-outs.
            </Typography>

            {locError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '12px' }}>
                {locError}
              </Alert>
            )}

            {locSuccess && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontSize: '12px' }}>
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
                  label="Allowed Radius (Meters)"
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
                  borderRadius: 2, 
                  fontFamily: 'Outfit',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderColor: '#cbd5e1',
                  color: '#334155',
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
                borderRadius: 2, 
                textTransform: 'none', 
                px: 3,
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: '12.5px',
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
                borderRadius: 2, 
                textTransform: 'none', 
                px: 3,
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: '12.5px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: '0 4px 12px 0 rgba(2, 132, 199, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
                  boxShadow: '0 6px 16px 0 rgba(2, 132, 199, 0.3)',
                }
              }}
            >
              {locSaving ? <CircularProgress size={18} color="inherit" /> : 'Save Geofence'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Details Dialog for Clickable Cards */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDialogSearch('');
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1.5,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', color: '#1e293b' }}>
            {detailsDialogTitle}
          </Typography>
          <IconButton onClick={() => {
            setDetailsDialogOpen(false);
            setDialogSearch('');
          }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : detailsType === 'percentage' ? (
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={detailsDialogData.percentage || 0}
                  size={120}
                  thickness={5}
                  sx={{ color: '#8b5cf6' }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h5" component="div" color="text.secondary" sx={{ fontWeight: 'bold', fontFamily: 'Outfit' }}>
                    {`${(detailsDialogData.percentage || 0).toFixed(1)}%`}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mt: 1, width: '100%', maxWidth: '500px' }}>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">Total Employees</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{detailsDialogData.total}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 2, textAlign: 'center', borderColor: '#10b981' }}>
                    <Typography variant="caption" color="text.secondary" display="block">Present Today</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#10b981' }}>{detailsDialogData.present}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 2, textAlign: 'center', borderColor: '#ef4444' }}>
                    <Typography variant="caption" color="text.secondary" display="block">Absent Today</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ef4444' }}>{detailsDialogData.absent}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 2, textAlign: 'center', borderColor: '#f59e0b' }}>
                    <Typography variant="caption" color="text.secondary" display="block">Late Arrivals</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f59e0b' }}>{detailsDialogData.late}</Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search by code, name, department..."
                value={dialogSearch}
                onChange={(e) => setDialogSearch(e.target.value)}
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
                  style: { borderRadius: 8, fontSize: '13px', fontFamily: 'Inter' }
                }}
              />

              {filteredData.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: '#64748b' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'Inter' }}>
                    No matching records found.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', py: 1.5, fontFamily: 'Outfit' }}>Code</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', py: 1.5, fontFamily: 'Outfit' }}>Name</TableCell>
                        {detailsType === 'employees' || detailsType === 'absent' ? (
                          <>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5, fontFamily: 'Outfit' }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5, fontFamily: 'Outfit' }}>Designation</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5, fontFamily: 'Outfit' }}>Email</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5, fontFamily: 'Outfit' }}>Check In</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5, fontFamily: 'Outfit' }}>Check Out</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5, fontFamily: 'Outfit' }}>Location</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5, fontFamily: 'Outfit' }}>Selfie</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredData.map((item, idx) => {
                        const code = item.employeeCode || item.employeeCode || '—';
                        const name = item.firstName ? `${item.firstName} ${item.lastName}` : item.employeeName || '—';
                        
                        return (
                          <TableRow key={item.id || idx} hover>
                            <TableCell sx={{ py: 1.5, fontSize: '12.5px', fontFamily: 'Inter', fontWeight: 600, color: '#0284c7' }}>{code}</TableCell>
                            <TableCell sx={{ py: 1.5, fontSize: '13px', fontFamily: 'Outfit', fontWeight: 'bold' }}>{name}</TableCell>
                            {detailsType === 'employees' || detailsType === 'absent' ? (
                              <>
                                <TableCell sx={{ py: 1.5, fontSize: '12.5px', fontFamily: 'Inter' }}>{item.department || '—'}</TableCell>
                                <TableCell sx={{ py: 1.5, fontSize: '12.5px', fontFamily: 'Inter' }}>{item.designation || '—'}</TableCell>
                                <TableCell sx={{ py: 1.5, fontSize: '12.5px', fontFamily: 'Inter', color: '#64748b' }}>{item.email || '—'}</TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell sx={{ py: 1.5, fontSize: '12.5px', fontFamily: 'Inter', color: '#10b981', fontWeight: 600 }}>{formatTime(item.checkIn)}</TableCell>
                                <TableCell sx={{ py: 1.5, fontSize: '12.5px', fontFamily: 'Inter', color: '#3b82f6', fontWeight: 600 }}>{formatTime(item.checkOut)}</TableCell>
                                <TableCell sx={{ py: 1.5, fontSize: '12.5px', fontFamily: 'Inter' }}>
                                  <Chip
                                    label={item.checkInLocationType || 'Office'}
                                    size="small"
                                    color={item.checkInLocationType === 'Office Location' || !item.checkInLocationType ? 'success' : 'warning'}
                                    sx={{ fontWeight: 'bold', fontSize: '10px', height: 20 }}
                                  />
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  {item.checkInSelfie ? (
                                    <MuiTooltip title="Selfie (Hover to zoom)">
                                      <Box
                                        component="img"
                                        src={item.checkInSelfie}
                                        alt="Selfie"
                                        sx={{
                                          width: 32,
                                          height: 32,
                                          borderRadius: '50%',
                                          objectFit: 'cover',
                                          border: '1.5px solid #10b981',
                                          cursor: 'pointer',
                                          transition: 'transform 0.2s',
                                          '&:hover': { transform: 'scale(3.5)', zIndex: 10 }
                                        }}
                                      />
                                    </MuiTooltip>
                                  ) : '—'}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => {
            setDetailsDialogOpen(false);
            setDialogSearch('');
          }} sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDashboard;
