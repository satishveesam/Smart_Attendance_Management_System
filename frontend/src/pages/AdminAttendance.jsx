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
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const AdminAttendance = () => {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Audit Dialog state
  const [selectedLog, setSelectedLog] = useState(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceLogs();
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: { xs: '22px', sm: '28px' } }}>
          Attendance Logs
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '13px' }}>
          Monitor daily employee presence records, check-in timestamps, and check-out durations.
        </Typography>
      </Box>

      {/* Filter Panel */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 3.5, boxShadow: '0 4px 12px rgba(50, 50, 93, 0.02)', border: '1px solid #f1f5f9' }}>
        <Box component="form" onSubmit={handleFilterSubmit}>

          {/* Row 1: Date + Employee + Department + Search */}
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Employee"
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
              >
                <MenuItem value="" style={{ fontSize: '13px', fontFamily: 'Inter' }}>All Employees</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id} style={{ fontSize: '13px', fontFamily: 'Inter' }}>
                    {emp.employeeCode} - {emp.firstName} {emp.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
              />
            </Grid>
          </Grid>

          {/* Row 2: Search + Export Buttons */}
          <Box sx={{ 
            mt: 2.5, 
            pt: 2, 
            borderTop: '1px solid #f1f5f9', 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            gap: 1.5
          }}>
            {/* Search Button */}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SearchIcon sx={{ fontSize: 18 }} />}
              fullWidth
              sx={{
                maxWidth: { sm: '160px' },
                height: 44,
                borderRadius: 2.5,
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: '0 4px 12px 0 rgba(2, 132, 199, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
                  boxShadow: '0 6px 16px 0 rgba(2, 132, 199, 0.3)',
                },
              }}
            >
              Search Logs
            </Button>

            {/* Export Buttons */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<PdfIcon sx={{ fontSize: 16 }} />}
                onClick={handleExportPdf}
                disabled={exportingPdf || logs.length === 0}
                fullWidth
                sx={{ 
                  minWidth: { sm: '160px' },
                  height: 44,
                  textTransform: 'none', 
                  borderRadius: 2.5, 
                  fontWeight: 600,
                  fontSize: '12.5px',
                  fontFamily: 'Outfit',
                  borderColor: '#fecaca',
                  bgcolor: '#fef2f2',
                  color: '#ef4444',
                  '&:hover': { borderColor: '#fca5a5', bgcolor: '#fee2e2' },
                  '&:disabled': { opacity: 0.5 }
                }}
              >
                {exportingPdf ? <CircularProgress size={16} color="inherit" /> : 'Export PDF'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExcelIcon sx={{ fontSize: 16 }} />}
                onClick={handleExportExcel}
                disabled={exportingExcel || logs.length === 0}
                fullWidth
                sx={{ 
                  minWidth: { sm: '170px' },
                  height: 44,
                  textTransform: 'none', 
                  borderRadius: 2.5, 
                  fontWeight: 600,
                  fontSize: '12.5px',
                  fontFamily: 'Outfit',
                  borderColor: '#bbf7d0',
                  bgcolor: '#f0fdf4',
                  color: '#16a34a',
                  '&:hover': { borderColor: '#86efac', bgcolor: '#dcfce7' },
                  '&:disabled': { opacity: 0.5 }
                }}
              >
                {exportingExcel ? <CircularProgress size={16} color="inherit" /> : 'Export Excel'}
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
      ) : logs.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', color: '#64748b', borderRadius: 3.5, border: '1px solid #f1f5f9' }}>
          <Typography variant="body1" sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px' }}>
            No attendance records found for the selected filters.
          </Typography>
        </Paper>
      ) : (
        <>
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
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Check-In GPS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Check-Out GPS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }} align="right">Audit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#0284c7', fontFamily: 'Inter', fontSize: '13px' }}>{log.employeeCode}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: '13.5px' }}>{log.employeeName}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{log.attendanceDate}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#10b981', fontWeight: 500 }}>{formatTime(log.checkIn)}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#3b82f6', fontWeight: 500 }}>{formatTime(log.checkOut)}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{log.totalHours != null ? `${log.totalHours.toFixed(2)} hrs` : '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter' }}>{getStatusChip(log.status)}</TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter' }}>
                      {log.checkInLatitude ? `${log.checkInLatitude.toFixed(4)}, ${log.checkInLongitude.toFixed(4)}` : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter' }}>
                      {log.checkOutLatitude ? `${log.checkOutLatitude.toFixed(4)}, ${log.checkOutLongitude.toFixed(4)}` : '-'}
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

          {/* Mobile Cards List View (xs only) */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 2.5 }}>
            {logs.map((log) => (
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
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
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter', fontSize: '11px' }}>Employee Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', color: '#1e293b' }}>{selectedLog.employeeName}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter', fontSize: '11px' }}>Employee Code</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0284c7', fontFamily: 'Outfit' }}>{selectedLog.employeeCode}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Inter', fontSize: '11px' }}>Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', color: '#1e293b' }}>{selectedLog.attendanceDate}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
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
