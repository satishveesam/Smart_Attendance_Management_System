import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import API from '../api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const AdminReports = () => {
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState({ pdf: false, excel: false });

  // Filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreview = async (e) => {
    if (e) e.preventDefault();
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

  const handleExportPdf = async () => {
    setExportLoading((prev) => ({ ...prev, pdf: true }));
    try {
      const res = await API.get('/reports/export/pdf', {
        params: {
          startDate,
          endDate,
          employeeId: selectedEmp || null,
          department: department || null,
        },
        responseType: 'blob',
      });
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Attendance_Report_${startDate}_to_${endDate}.pdf`;
      link.click();
    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      setExportLoading((prev) => ({ ...prev, pdf: false }));
    }
  };

  const handleExportExcel = async () => {
    setExportLoading((prev) => ({ ...prev, excel: true }));
    try {
      const res = await API.get('/reports/export/excel', {
        params: {
          startDate,
          endDate,
          employeeId: selectedEmp || null,
          department: department || null,
        },
        responseType: 'blob',
      });
      
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Attendance_Report_${startDate}_to_${endDate}.xlsx`;
      link.click();
    } catch (err) {
      console.error("Failed to export Excel", err);
    } finally {
      setExportLoading((prev) => ({ ...prev, excel: false }));
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

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Reports Generator
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Query company attendance and generate PDF summaries or Excel sheets
        </Typography>
      </Box>

      {/* Filter and Action Panel */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 3 }}>
              Report Filters
            </Typography>
            <Box component="form" onSubmit={handlePreview}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Employee"
                    value={selectedEmp}
                    onChange={(e) => setSelectedEmp(e.target.value)}
                  >
                    <MenuItem value="">All Employees</MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.firstName} {emp.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    fullWidth
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    Preview Report
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 2 }}>
                  Export Formats
                </Typography>
                <Typography variant="body2" color="#64748b" sx={{ mb: 4 }}>
                  Ensure you preview the filters before printing or downloading the reports.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  startIcon={exportLoading.pdf ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                  onClick={handleExportPdf}
                  disabled={logs.length === 0 || exportLoading.pdf}
                  sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                >
                  Export to PDF
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  size="large"
                  startIcon={exportLoading.excel ? <CircularProgress size={20} color="inherit" /> : <ExcelIcon />}
                  onClick={handleExportExcel}
                  disabled={logs.length === 0 || exportLoading.excel}
                  sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                >
                  Export to Excel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Section */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 2 }}>
        Report Preview ({logs.length} records)
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: '#64748b', borderRadius: 3 }}>
          Click "Preview Report" to display logs.
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', mb: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Emp Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Hours</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ fontWeight: 500, color: '#0284c7' }}>{log.employeeCode}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{log.employeeName}</TableCell>
                  <TableCell>{log.attendanceDate}</TableCell>
                  <TableCell>{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                  <TableCell>{log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                  <TableCell>{log.totalHours != null ? `${log.totalHours.toFixed(1)} hrs` : '-'}</TableCell>
                  <TableCell>{getStatusChip(log.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </AdminLayout>
  );
};

export default AdminReports;
