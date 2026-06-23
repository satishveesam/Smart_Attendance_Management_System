import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import API from '../api';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  CircularProgress,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Divider,
  Alert,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Close as CloseIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';

const AdminAttendance = () => {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLogs, setPendingLogs] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores id of record being actioned

  // Audit Dialog state
  const [selectedLog, setSelectedLog] = useState(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('sv-SE')
  );
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [selectedEmp, setSelectedEmp] = useState('');
  const [department, setDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredLogs = logs.filter(log => {
    if (!statusFilter) return true;
    return log.status === statusFilter;
  });

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceLogs();
    fetchPendingLogs();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceLogs = async () => {
    setLoading(true);
    try {
      let url = `/reports?startDate=${startDate}&endDate=${endDate}`;
      if (selectedEmp) {
        url += `&employeeId=${selectedEmp}`;
      }
      if (department) {
        url += `&department=${department}`;
      }
      const res = await API.get(url);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingLogs = async () => {
    setPendingLoading(true);
    try {
      const res = await API.get('/attendance/pending');
      setPendingLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch pending logs', err);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await API.post(`/attendance/${id}/approve`);
      fetchPendingLogs();
      fetchAttendanceLogs();
    } catch (err) {
      console.error('Approve failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await API.post(`/attendance/${id}/reject`);
      fetchPendingLogs();
      fetchAttendanceLogs();
    } catch (err) {
      console.error('Reject failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchAttendanceLogs();
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      let url = `/reports/export/pdf?startDate=${startDate}&endDate=${endDate}`;
      if (selectedEmp) {
        url += `&employeeId=${selectedEmp}`;
      }
      if (department) {
        url += `&department=${department}`;
      }
      
      const res = await API.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `attendance_report_${startDate}_to_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      let url = `/reports/export/excel?startDate=${startDate}&endDate=${endDate}`;
      if (selectedEmp) {
        url += `&employeeId=${selectedEmp}`;
      }
      if (department) {
        url += `&department=${department}`;
      }
      
      const res = await API.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `attendance_report_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export Excel", err);
    } finally {
      setExportingExcel(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PRESENT':
        return <Chip label="Present" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'LATE':
        return <Chip label="Late" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'HALF_DAY':
        return <Chip label="Half Day" color="primary" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'ABSENT':
        return <Chip label="Absent" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'PENDING':
        return <Chip label="Pending" size="small" sx={{ fontWeight: 'bold', bgcolor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }} />;
      case 'EXTRA_SHIFT':
        return <Chip label="Extra Shift" size="small" sx={{ fontWeight: 'bold', bgcolor: '#8b5cf6', color: '#fff' }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <AdminLayout>
      {/* Page Header Welcome Banner */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: 4, 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, rgba(56, 189, 248, 0) 70%)', zIndex: 0 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.5px', fontSize: { xs: '20px', sm: '28px' } }}>
            Attendance Registry
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontFamily: 'Inter', fontSize: { xs: '11px', sm: '13px' }, maxWidth: '600px', display: { xs: 'none', sm: 'block' } }}>
            Monitor and audit daily employee presence records, check-in timestamps, geolocation logs, and pending verification requests.
          </Typography>
        </Box>
      </Paper>

      {/* ── Pending Approvals Panel ── */}
      <Paper sx={{ p: { xs: 1.5, sm: 3 }, mb: 3, borderRadius: 3, border: '1px solid rgba(245, 158, 11, 0.25)', borderLeft: '4px solid #f59e0b', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.04)', bgcolor: '#fffdf6' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#fef3c7', display: 'flex' }}>
            <PendingIcon sx={{ color: '#f59e0b', fontSize: { xs: 16, sm: 20 } }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#92400e', fontFamily: 'Outfit', fontSize: { xs: '13px', sm: '16px' } }}>
              Pending Log Validations
            </Typography>
            <Typography sx={{ color: '#b45309', fontFamily: 'Inter', fontSize: { xs: '10px', sm: '12px' }, display: { xs: 'none', sm: 'block' } }}>
              Verify biometric selfies and geofence criteria to approve or reject check-in entries.
            </Typography>
          </Box>
          <Chip
            label={pendingLoading ? '...' : `${pendingLogs.length} pending`}
            sx={{ ml: 'auto', bgcolor: pendingLogs.length > 0 ? '#f59e0b' : '#10b981', color: '#fff', fontWeight: 800, fontFamily: 'Outfit', fontSize: { xs: '9px', sm: '11px' } }}
            size="small"
          />
        </Box>

        <Divider sx={{ mb: 1.5, borderColor: 'rgba(245, 158, 11, 0.15)' }} />

        {pendingLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: '#f59e0b' }} />
          </Box>
        ) : pendingLogs.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 0.5 }}>
            <Typography sx={{ fontSize: '20px' }}>⚡</Typography>
            <Typography sx={{ color: '#047857', fontWeight: 700, fontSize: { xs: '11px', sm: '13px' }, fontFamily: 'Outfit' }}>
              Pending queue is clear
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: { xs: '9px', sm: '11px' }, fontFamily: 'Inter' }}>
              No outstanding check-in records require administrator verification.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {pendingLogs.map((log) => (
              <Grid item xs={12} sm={6} md={4} key={log.id}>
                <Card sx={{ borderRadius: 2.5, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)', bgcolor: '#fff' }}>
                  <CardContent sx={{ p: { xs: 1.2, sm: 2 }, '&:last-child': { pb: { xs: 1.2, sm: 2 } } }}>
                    <Box sx={{ display: 'flex', gap: 1.2, mb: 1.2, alignItems: 'center' }}>
                      {log.checkInSelfie ? (
                        <Box
                          component="img"
                          src={log.checkInSelfie}
                          alt="Selfie"
                          sx={{ 
                            width: { xs: 36, sm: 44 }, 
                            height: { xs: 36, sm: 44 }, 
                            objectFit: 'cover', 
                            borderRadius: '50%', 
                            border: '1.5px solid #f59e0b',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <Box sx={{ width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, bgcolor: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #fde68a', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px' }}>📷</span>
                        </Box>
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit', fontSize: { xs: '12px', sm: '14.5px' } }}>
                          {log.employeeName}
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: { xs: '10px', sm: '12px' } }}>
                          {log.employeeCode}
                        </Typography>
                      </Box>
                      <Chip label="VERIFY" size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: { xs: '8px', sm: '10px' }, border: '1px solid #fde68a', height: 18 }} />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, bgcolor: '#f8fafc', p: 1, borderRadius: 2 }}>
                      <Box>
                        <Typography sx={{ color: '#94a3b8', fontSize: { xs: '8px', sm: '9px' }, fontFamily: 'Inter', textTransform: 'uppercase', fontWeight: 600 }}>Date</Typography>
                        <Typography sx={{ fontWeight: 700, color: '#334155', fontFamily: 'Inter', fontSize: { xs: '10px', sm: '11.5px' } }}>{log.attendanceDate}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: '#94a3b8', fontSize: { xs: '8px', sm: '9px' }, fontFamily: 'Inter', textTransform: 'uppercase', fontWeight: 600 }}>Check-in</Typography>
                        <Typography sx={{ fontWeight: 700, color: '#334155', fontFamily: 'Inter', fontSize: { xs: '10px', sm: '11.5px' } }}>
                          {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: '#94a3b8', fontSize: { xs: '8px', sm: '9px' }, fontFamily: 'Inter', textTransform: 'uppercase', fontWeight: 600 }}>Criteria</Typography>
                        <Typography sx={{ 
                          fontWeight: 700, 
                          color: log.checkInLocationType === 'Office Location' ? '#10b981' : '#ef4444', 
                          fontFamily: 'Inter', 
                          fontSize: { xs: '9px', sm: '11px' } 
                        }}>
                          {log.checkInLocationType || 'Off-site'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={actionLoading === log.id ? <CircularProgress size={12} color="inherit" /> : <ApproveIcon sx={{ fontSize: 14 }} />}
                        disabled={actionLoading === log.id}
                        onClick={() => handleApprove(log.id)}
                        sx={{
                          textTransform: 'none',
                          fontFamily: 'Outfit',
                          fontWeight: 700,
                          fontSize: { xs: '10px', sm: '11.5px' },
                          borderRadius: 2,
                          py: 0.6,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={actionLoading === log.id ? <CircularProgress size={12} color="inherit" /> : <RejectIcon sx={{ fontSize: 14 }} />}
                        disabled={actionLoading === log.id}
                        onClick={() => handleReject(log.id)}
                        sx={{
                          textTransform: 'none',
                          fontFamily: 'Outfit',
                          fontWeight: 700,
                          fontSize: { xs: '10px', sm: '11.5px' },
                          borderRadius: 2,
                          py: 0.6,
                          borderColor: '#fca5a5',
                          color: '#ef4444',
                          bgcolor: '#fef2f2',
                          '&:hover': { borderColor: '#f87171', bgcolor: '#fee2e2' },
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>



      {/* Filter Panel */}
      <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0, 0, 0, 0.01)', border: '1px solid #e2e8f0' }}>
        <Box component="form" onSubmit={handleFilterSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', fontWeight: 600 } }}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', fontWeight: 600 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Employee"
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', fontWeight: 600 } }}
              >
                <MenuItem value="" style={{ fontSize: '13px', fontFamily: 'Inter' }}>All Employees</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id} style={{ fontSize: '13px', fontFamily: 'Inter' }}>
                    {emp.employeeCode} - {emp.firstName} {emp.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', fontWeight: 600 } }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={2.4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', fontWeight: 600 } }}
              >
                <MenuItem value="" style={{ fontSize: '13px', fontFamily: 'Inter' }}>All Statuses</MenuItem>
                <MenuItem value="PRESENT" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Present</MenuItem>
                <MenuItem value="LATE" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Late Check-Ins</MenuItem>
                <MenuItem value="HALF_DAY" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Half Day</MenuItem>
                <MenuItem value="ABSENT" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Absent</MenuItem>
                <MenuItem value="EXTRA_SHIFT" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Extra Shift</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Row 2: Search + Export Buttons */}
          <Box sx={{ 
            mt: 2, 
            pt: 2, 
            borderTop: '1px solid #f1f5f9', 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5
          }}>
            {/* Search Button */}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
              fullWidth
              sx={{
                maxWidth: { sm: '150px' },
                height: 38,
                borderRadius: 2,
                fontFamily: 'Outfit',
                fontWeight: 700,
                fontSize: '13px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
                  boxShadow: 'none',
                },
              }}
            >
              Filter Registry
            </Button>

            {/* Export Buttons */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="outlined"
                startIcon={<PdfIcon sx={{ fontSize: 15 }} />}
                onClick={handleExportPdf}
                disabled={exportingPdf || logs.length === 0}
                fullWidth
                sx={{ 
                  minWidth: { sm: '130px' },
                  height: 38,
                  textTransform: 'none', 
                  borderRadius: 2, 
                  fontWeight: 700,
                  fontSize: '12px',
                  fontFamily: 'Outfit',
                  borderColor: '#fca5a5',
                  bgcolor: '#fef2f2',
                  color: '#ef4444',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#f87171', bgcolor: '#fee2e2', boxShadow: 'none' },
                  '&:disabled': { opacity: 0.5 }
                }}
              >
                {exportingPdf ? <CircularProgress size={14} color="inherit" /> : 'Export PDF'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExcelIcon sx={{ fontSize: 15 }} />}
                onClick={handleExportExcel}
                disabled={exportingExcel || logs.length === 0}
                fullWidth
                sx={{ 
                  minWidth: { sm: '140px' },
                  height: 38,
                  textTransform: 'none', 
                  borderRadius: 2, 
                  fontWeight: 700,
                  fontSize: '12px',
                  fontFamily: 'Outfit',
                  borderColor: '#86efac',
                  bgcolor: '#f0fdf4',
                  color: '#16a34a',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#4ade80', bgcolor: '#dcfce7', boxShadow: 'none' },
                  '&:disabled': { opacity: 0.5 }
                }}
              >
                {exportingExcel ? <CircularProgress size={14} color="inherit" /> : 'Export Excel'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Logs Container */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : filteredLogs.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', color: '#64748b', borderRadius: 3.5, border: '1px solid #f1f5f9' }}>
          <Typography variant="body1" sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px' }}>
            No attendance records found for the selected filters.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Stats summary row */}
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid item xs={4} sm={4} md={4}>
              <Card sx={{ borderRadius: 3, border: 'none', boxShadow: 'none', bgcolor: '#e0f2fe' }}>
                <CardContent sx={{ p: { xs: 0.8, sm: 2 }, '&:last-child': { pb: { xs: 0.8, sm: 2 } } }}>
                  <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 800, display: 'block', fontSize: { xs: '6.8px', sm: '11px' }, textTransform: 'uppercase', letterSpacing: '0.3px', opacity: 0.85 }}>
                    Total Logs
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '13px', sm: '22px' }, color: '#0f172a', fontFamily: 'Outfit', mt: 0.5 }}>
                    {filteredLogs.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4} sm={4} md={4}>
              <Card sx={{ borderRadius: 3, border: 'none', boxShadow: 'none', bgcolor: '#ede9fe' }}>
                <CardContent sx={{ p: { xs: 0.8, sm: 2 }, '&:last-child': { pb: { xs: 0.8, sm: 2 } } }}>
                  <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 800, display: 'block', fontSize: { xs: '6.8px', sm: '11px' }, textTransform: 'uppercase', letterSpacing: '0.3px', opacity: 0.85 }}>
                    Overtime Hours
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '13px', sm: '22px' }, color: '#0f172a', fontFamily: 'Outfit', mt: 0.5 }}>
                    {(() => {
                      const totalMinutes = filteredLogs.reduce((acc, log) => {
                        if (log.totalHours && log.totalHours > 8.0) {
                          return acc + Math.round((log.totalHours - 8.0) * 60);
                        }
                        return acc;
                      }, 0);
                      const hrs = Math.floor(totalMinutes / 60);
                      const mins = totalMinutes % 60;
                      return `${hrs}h ${mins}m`;
                    })()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4} sm={4} md={4}>
              <Card sx={{ borderRadius: 3, border: 'none', boxShadow: 'none', bgcolor: '#fef3c7' }}>
                <CardContent sx={{ p: { xs: 0.8, sm: 2 }, '&:last-child': { pb: { xs: 0.8, sm: 2 } } }}>
                  <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 800, display: 'block', fontSize: { xs: '6.8px', sm: '11px' }, textTransform: 'uppercase', letterSpacing: '0.3px', opacity: 0.85 }}>
                    Overtime Staff
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '13px', sm: '22px' }, color: '#0f172a', fontFamily: 'Outfit', mt: 0.5 }}>
                    {new Set(filteredLogs.filter(log => log.totalHours && log.totalHours > 8.0).map(log => log.employeeId)).size}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Desktop Table View (sm & up) */}
          <TableContainer 
            component={Paper} 
            sx={{ 
              display: { xs: 'none', sm: 'block' }, 
              borderRadius: 3.5, 
              boxShadow: '0 4px 20px -2px rgba(50, 50, 93, 0.02), 0 2px 8px -1px rgba(0, 0, 0, 0.01)', 
              border: '1px solid #f1f5f9', 
              overflow: 'hidden' 
            }}
          >
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Emp Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Check In</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Check Out</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Total Hours</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Extra Hours</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Check-In GPS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Check-Out GPS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }} align="right">Audit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#0284c7', fontFamily: 'Inter', fontSize: '13px' }}>{log.employeeCode}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: '13.5px' }}>{log.employeeName}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{log.attendanceDate}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {log.checkInSelfie ? (
                          <Tooltip title="Check-In Selfie (Hover to enlarge)">
                            <Box
                              component="img"
                              src={log.checkInSelfie}
                              alt="In"
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1.5px solid #10b981',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(3.5)', zIndex: 10 }
                              }}
                              onClick={() => {
                                setSelectedLog(log);
                                setAuditOpen(true);
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#f8fafc', border: '1.5px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#94a3b8' }}>
                            📷
                          </Box>
                        )}
                        <Typography sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#10b981', fontWeight: 500 }}>
                          {formatTime(log.checkIn)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {log.checkOutSelfie ? (
                          <Tooltip title="Check-Out Selfie (Hover to enlarge)">
                            <Box
                              component="img"
                              src={log.checkOutSelfie}
                              alt="Out"
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1.5px solid #3b82f6',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(3.5)', zIndex: 10 }
                              }}
                              onClick={() => {
                                setSelectedLog(log);
                                setAuditOpen(true);
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#f8fafc', border: '1.5px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#94a3b8' }}>
                            📷
                          </Box>
                        )}
                        <Typography sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#3b82f6', fontWeight: 500 }}>
                          {formatTime(log.checkOut)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{log.totalHours != null ? `${log.totalHours.toFixed(2)} hrs` : '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: log.totalHours && log.totalHours > 8.0 ? '#8b5cf6' : '#64748b', fontWeight: log.totalHours && log.totalHours > 8.0 ? 'bold' : 'normal' }}>
                      {log.totalHours && log.totalHours > 8.0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>{`${(log.totalHours - 8.0).toFixed(2)} hrs`}</span>
                          <Chip label="OT" size="small" sx={{ bgcolor: '#f5f3ff', color: '#8b5cf6', height: 16, fontSize: '8px', fontWeight: 'bold', border: '1px solid #ddd6fe', borderRadius: 1 }} />
                        </Box>
                      ) : '0.00 hrs'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Inter' }}>{getStatusChip(log.status)}</TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter' }}>
                      {log.checkInLatitude ? (
                        <Box>
                          <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: log.checkInLocationType === 'Office Location' ? '#10b981' : '#ef4444', fontFamily: 'Inter' }}>
                            {log.checkInLocationType}
                          </Typography>
                          <Typography sx={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'Inter' }}>
                            {log.checkInLatitude.toFixed(4)}, {log.checkInLongitude.toFixed(4)}
                          </Typography>
                        </Box>
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter' }}>
                      {log.checkOutLatitude ? (
                        <Box>
                          <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: log.checkOutLocationType === 'Office Location' ? '#10b981' : '#ef4444', fontFamily: 'Inter' }}>
                            {log.checkOutLocationType}
                          </Typography>
                          <Typography sx={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'Inter' }}>
                            {log.checkOutLatitude.toFixed(4)}, {log.checkOutLongitude.toFixed(4)}
                          </Typography>
                        </Box>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Biometric & Location Audit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedLog(log);
                            setAuditOpen(true);
                          }}
                          sx={{ bgcolor: '#f0f9ff', '&:hover': { bgcolor: '#e0f2fe' } }}
                        >
                          <ViewIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 2.5 }}>
            {filteredLogs.map((log) => (
              <Card 
                key={log.id} 
                sx={{ 
                  borderRadius: 3.5, 
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 12px rgba(50, 50, 93, 0.02)',
                  bgcolor: '#fff',
                  p: 2.2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 600, color: '#0284c7', fontSize: '11px', fontFamily: 'Inter' }}>
                    {log.employeeCode}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusChip(log.status)}
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => {
                        setSelectedLog(log);
                        setAuditOpen(true);
                      }} 
                      sx={{ bgcolor: '#f0f9ff', p: 0.6 }}
                    >
                      <ViewIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography sx={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', fontFamily: 'Outfit' }}>
                  {log.employeeName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: '12px', fontFamily: 'Inter' }}>
                  📅 Date: {log.attendanceDate}
                </Typography>

                {/* Mobile Selfie Previews */}
                <Box sx={{ display: 'flex', gap: 1.5, my: 1.5 }}>
                  {log.checkInSelfie ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'Inter', fontWeight: 600 }}>In Selfie</Typography>
                      <Box
                        component="img"
                        src={log.checkInSelfie}
                        alt="In"
                        sx={{ 
                          width: 55, 
                          height: 55, 
                          objectFit: 'cover', 
                          borderRadius: 2, 
                          border: '1.5px solid #10b981' 
                        }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'Inter', fontWeight: 600 }}>In Selfie</Typography>
                      <Box sx={{ width: 55, height: 55, bgcolor: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#94a3b8' }}>
                        📷
                      </Box>
                    </Box>
                  )}

                  {log.checkOutSelfie ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'Inter', fontWeight: 600 }}>Out Selfie</Typography>
                      <Box
                        component="img"
                        src={log.checkOutSelfie}
                        alt="Out"
                        sx={{ 
                          width: 55, 
                          height: 55, 
                          objectFit: 'cover', 
                          borderRadius: 2, 
                          border: '1.5px solid #3b82f6' 
                        }}
                      />
                    </Box>
                  ) : log.checkIn && !log.checkOut ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'Inter', fontWeight: 600 }}>Out Selfie</Typography>
                      <Box sx={{ width: 55, height: 55, bgcolor: '#eff6ff', border: '1.5px dashed #bfdbfe', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#1e3a8a', fontWeight: 'bold' }}>
                        ACTIVE
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'Inter', fontWeight: 600 }}>Out Selfie</Typography>
                      <Box sx={{ width: 55, height: 55, bgcolor: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#94a3b8' }}>
                        📷
                      </Box>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '10px' }}>Check In</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '11.5px', color: '#10b981', fontFamily: 'Outfit' }}>{formatTime(log.checkIn)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '10px' }}>Check Out</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '11.5px', color: '#3b82f6', fontFamily: 'Outfit' }}>{formatTime(log.checkOut)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '10px' }}>Duration</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', fontFamily: 'Outfit' }}>
                      {log.totalHours != null ? `${log.totalHours.toFixed(1)}h` : '-'}
                      {log.totalHours && log.totalHours > 8.0 ? ` (OT: ${(log.totalHours - 8.0).toFixed(1)}h)` : ''}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </>
      )}

      {/* Biometric & Geolocation Audit Dialog */}
      <Dialog 
        open={auditOpen} 
        onClose={() => setAuditOpen(false)} 
        maxWidth="md" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', fontSize: '17px' }}>Biometric & Location Audit Log</Typography>
          <IconButton onClick={() => setAuditOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pb: 3, borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
          {selectedLog && (
            <Box sx={{ fontFamily: 'Inter' }}>
              {/* Employee Header info */}
              <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter', fontSize: '11px' }}>Employee Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', color: '#1e293b' }}>{selectedLog.employeeName}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter', fontSize: '11px' }}>Employee Code</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0284c7', fontFamily: 'Outfit' }}>{selectedLog.employeeCode}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter', fontSize: '11px' }}>Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', color: '#1e293b' }}>{selectedLog.attendanceDate}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter', fontSize: '11px' }}>Total Hours</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', color: '#1e293b' }}>
                      {selectedLog.totalHours != null ? `${selectedLog.totalHours.toFixed(2)} hrs` : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter', fontSize: '11px' }}>Extra Hours</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', color: selectedLog.totalHours && selectedLog.totalHours > 8.0 ? '#8b5cf6' : '#64748b' }}>
                      {selectedLog.totalHours && selectedLog.totalHours > 8.0 ? `${(selectedLog.totalHours - 8.0).toFixed(2)} hrs` : '0.00 hrs'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter', fontSize: '11px' }}>Overall Status</Typography>
                    <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedLog.status)}</Box>
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={3}>
                {/* Check-In Details */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2.5, height: '100%', borderRadius: 3, bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#10b981', mb: 2, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
                      🟢 Check-In Audit Details
                    </Typography>
                    
                    {/* Selfie Image */}
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                      {selectedLog.checkInSelfie ? (
                        <Box
                          component="img"
                          src={selectedLog.checkInSelfie}
                          alt="Check-In Selfie"
                          sx={{ 
                            width: '100%', 
                            maxWidth: 240, 
                            height: 180, 
                            objectFit: 'cover', 
                            borderRadius: 2.5, 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.04)' 
                          }}
                        />
                      ) : (
                        <Box sx={{ width: '100%', height: 180, bgcolor: '#f8fafc', borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Inter' }}>No Selfie Captured</Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter' }}>Timestamp</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'Outfit', color: '#334155' }}>
                          {selectedLog.checkIn ? new Date(selectedLog.checkIn).toLocaleString() : '-'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter' }}>GPS Geolocation</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'Outfit', color: '#334155' }}>
                          {selectedLog.checkInLatitude ? `${selectedLog.checkInLatitude.toFixed(6)}, ${selectedLog.checkInLongitude.toFixed(6)}` : '-'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter' }}>Resolved Location Address</Typography>
                        <Typography variant="body2" sx={{ fontSize: '12.5px', color: '#475569', fontWeight: 500, fontFamily: 'Inter' }}>
                          {selectedLog.checkInAddress || 'No Address Logged'}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Check-Out Details */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2.5, height: '100%', borderRadius: 3, bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#3b82f6', mb: 2, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
                      🔵 Check-Out Audit Details
                    </Typography>

                    {/* Selfie Image */}
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                      {selectedLog.checkOutSelfie ? (
                        <Box
                          component="img"
                          src={selectedLog.checkOutSelfie}
                          alt="Check-Out Selfie"
                          sx={{ 
                            width: '100%', 
                            maxWidth: 240, 
                            height: 180, 
                            objectFit: 'cover', 
                            borderRadius: 2.5, 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.04)' 
                          }}
                        />
                      ) : (
                        <Box sx={{ width: '100%', height: 180, bgcolor: '#f8fafc', borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Inter' }}>No Selfie Captured</Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter' }}>Timestamp</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'Outfit', color: '#334155' }}>
                          {selectedLog.checkOut ? new Date(selectedLog.checkOut).toLocaleString() : '-'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter' }}>GPS Geolocation</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'Outfit', color: '#334155' }}>
                          {selectedLog.checkOutLatitude ? `${selectedLog.checkOutLatitude.toFixed(6)}, ${selectedLog.checkOutLongitude.toFixed(6)}` : '-'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter' }}>Resolved Location Address</Typography>
                        <Typography variant="body2" sx={{ fontSize: '12.5px', color: '#475569', fontWeight: 500, fontFamily: 'Inter' }}>
                          {selectedLog.checkOutAddress || 'No Address Logged'}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setAuditOpen(false)} 
            variant="contained" 
            sx={{ 
              px: 4, 
              borderRadius: 2, 
              textTransform: 'none', 
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: '13px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)'
              }
            }}
          >
            Close Audit Log
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAttendance;
