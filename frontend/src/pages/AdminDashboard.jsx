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
    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
    } finally {
      setLoading(false);
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

  const statCards = stats
    ? [
        {
          title: 'Total Employees',
          value: stats.totalEmployees,
          icon: <PeopleIcon sx={{ fontSize: 22, color: '#0284c7' }} />,
          bg: 'rgba(2, 132, 199, 0.08)',
          borderColor: '#0284c7',
        },
        {
          title: 'Present Today',
          value: stats.presentToday,
          icon: <PresentIcon sx={{ fontSize: 22, color: '#10b981' }} />,
          bg: 'rgba(16, 185, 129, 0.08)',
          borderColor: '#10b981',
        },
        {
          title: 'Absent Today',
          value: stats.absentToday,
          icon: <AbsentIcon sx={{ fontSize: 22, color: '#ef4444' }} />,
          bg: 'rgba(239, 68, 68, 0.08)',
          borderColor: '#ef4444',
        },
        {
          title: 'Late Arrivals',
          value: stats.lateArrivals,
          icon: <LateIcon sx={{ fontSize: 22, color: '#f59e0b' }} />,
          bg: 'rgba(245, 158, 11, 0.08)',
          borderColor: '#f59e0b',
        },
        {
          title: 'Attendance %',
          value: `${stats.attendancePercentage.toFixed(1)}%`,
          icon: <PercentIcon sx={{ fontSize: 22, color: '#8b5cf6' }} />,
          bg: 'rgba(139, 92, 246, 0.08)',
          borderColor: '#8b5cf6',
        },
      ]
    : [];

  return (
    <AdminLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: { xs: '22px', sm: '28px' } }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '13px' }}>
            Live attendance tracking, geofence definitions, and operational controls.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<PinIcon sx={{ fontSize: 16 }} />}
            onClick={handleOpenLocationSettings}
            fullWidth
            sx={{
              width: { sm: 'auto' },
              textTransform: 'none',
              borderRadius: 2.5,
              px: 2.5,
              py: 1.2,
              fontFamily: 'Outfit',
              fontSize: '12.5px',
              borderColor: '#cbd5e1',
              color: '#334155',
              fontWeight: 600,
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
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              textTransform: 'none',
              borderRadius: 2.5,
              px: 2.5,
              py: 1.2,
              fontFamily: 'Outfit',
              fontSize: '12.5px',
              fontWeight: 600,
              boxShadow: '0 4px 12px 0 rgba(2, 132, 199, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
                boxShadow: '0 6px 16px 0 rgba(2, 132, 199, 0.35)',
              },
            }}
          >
            Generate Attendance QR
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          {/* Stats Cards Row */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {statCards.map((card) => (
              <Grid item xs={6} sm={4} md={2.4} key={card.title}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    borderRadius: 3.5, 
                    bgcolor: '#fff',
                    border: '1px solid #f1f5f9',
                    borderTop: `4px solid ${card.borderColor}`,
                    boxShadow: '0 4px 20px -2px rgba(50, 50, 93, 0.03), 0 2px 8px -1px rgba(0, 0, 0, 0.01)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px -2px rgba(50, 50, 93, 0.08), 0 4px 12px -1px rgba(0, 0, 0, 0.02)',
                    }
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: '600', fontSize: { xs: '11px', sm: '12.5px' }, fontFamily: 'Inter' }}>
                        {card.title}
                      </Typography>
                      <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {card.icon}
                      </Box>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: '800', color: '#1e293b', fontSize: { xs: '20px', sm: '26px' }, fontFamily: 'Outfit' }}>
                      {card.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  borderRadius: 3.5, 
                  p: { xs: 2.5, sm: 3.5 }, 
                  bgcolor: '#fff', 
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 20px -2px rgba(50, 50, 93, 0.03), 0 2px 8px -1px rgba(0, 0, 0, 0.01)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: '16.5px' }}>
                      Weekly Attendance Analytics
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'Inter' }}>
                      Visual representation of daily check-ins and late occurrences
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 350, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 11, fontFamily: 'Inter' }} />
                      <YAxis stroke="#94a3b8" style={{ fontSize: 11, fontFamily: 'Inter' }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: 8, 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                          fontFamily: 'Inter',
                          fontSize: '12px'
                        }} 
                      />
                      <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: '12px', marginTop: '10px' }} />
                      <Area type="monotone" name="Present Count" dataKey="present" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresent)" />
                      <Area type="monotone" name="Late Arrivals" dataKey="late" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLate)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>
          </Grid>
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
                src={`http://localhost:8080/api/attendance/qr-code/${qrToken}`}
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
    </AdminLayout>
  );
};

export default AdminDashboard;
