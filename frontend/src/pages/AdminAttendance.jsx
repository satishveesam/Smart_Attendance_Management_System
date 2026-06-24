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
  Divider,
  Avatar,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Description as TemplateIcon,
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
} from '@mui/icons-material';

const AdminAttendance = () => {
  // View Toggle: 'summary' (Calendar Grid) vs 'detail' (Logs List)
  const [viewTab, setViewTab] = useState('summary');
  
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Month & Year for Report
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-indexed

  // Audit Dialog state
  const [selectedLog, setSelectedLog] = useState(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Filters for Detailed View
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [department, setDepartment] = useState('');

  // Generate Year options (last 3 years and next year)
  const years = [
    new Date().getFullYear() - 2,
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1
  ];

  // Month names
  const months = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' }
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch logs whenever month/year changes or when detail filters are submitted
  useEffect(() => {
    fetchAttendanceLogs();
  }, [selectedMonth, selectedYear]);

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
      let queryStart = startDate;
      let queryEnd = endDate;

      // If we are in Summary (Monthly Grid) view, calculate start and end dates of selected month
      if (viewTab === 'summary') {
        queryStart = formatLocalDate(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        queryEnd = formatLocalDate(selectedYear, selectedMonth, lastDay);
      }

      let url = `/reports?startDate=${queryStart}&endDate=${queryEnd}`;
      if (selectedEmp && viewTab === 'detail') {
        url += `&employeeId=${selectedEmp}`;
      }
      if (department && viewTab === 'detail') {
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

  // Timezone-safe local date formatter (YYYY-MM-DD)
  const formatLocalDate = (year, month, day) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Generate days array for selected month
  const getDaysArray = (year, month) => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const numDays = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let d = 1; d <= numDays; d++) {
      const date = new Date(year, month, d);
      result.push({
        dayNumber: d,
        dayName: names[date.getDay()],
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        dateString: formatLocalDate(year, month, d)
      });
    }
    return result;
  };

  const days = getDaysArray(selectedYear, selectedMonth);

  // Group logs by employee and date for O(1) grid rendering lookup
  const logsMap = {};
  logs.forEach(log => {
    if (!logsMap[log.employeeCode]) {
      logsMap[log.employeeCode] = {};
    }
    logsMap[log.employeeCode][log.attendanceDate] = log;
  });

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      let queryStart = startDate;
      let queryEnd = endDate;

      if (viewTab === 'summary') {
        queryStart = formatLocalDate(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        queryEnd = formatLocalDate(selectedYear, selectedMonth, lastDay);
      }

      let url = `/reports/export/pdf?startDate=${queryStart}&endDate=${queryEnd}`;
      if (selectedEmp && viewTab === 'detail') {
        url += `&employeeId=${selectedEmp}`;
      }
      if (department && viewTab === 'detail') {
        url += `&department=${department}`;
      }
      
      const res = await API.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `attendance_report_${queryStart}_to_${queryEnd}.pdf`);
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
      let queryStart = startDate;
      let queryEnd = endDate;

      if (viewTab === 'summary') {
        queryStart = formatLocalDate(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        queryEnd = formatLocalDate(selectedYear, selectedMonth, lastDay);
      }

      let url = `/reports/export/excel?startDate=${queryStart}&endDate=${queryEnd}`;
      if (selectedEmp && viewTab === 'detail') {
        url += `&employeeId=${selectedEmp}`;
      }
      if (department && viewTab === 'detail') {
        url += `&department=${department}`;
      }
      
      const res = await API.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `attendance_report_${queryStart}_to_${queryEnd}.xlsx`);
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
        return <Chip label="Present" color="success" size="small" sx={{ fontWeight: 'bold', fontSize: '10px', height: 20 }} />;
      case 'LATE':
        return <Chip label="Late" color="warning" size="small" sx={{ fontWeight: 'bold', fontSize: '10px', height: 20 }} />;
      case 'HALF_DAY':
        return <Chip label="Half Day" color="primary" size="small" sx={{ fontWeight: 'bold', fontSize: '10px', height: 20 }} />;
      case 'ABSENT':
        return <Chip label="Absent" color="error" size="small" sx={{ fontWeight: 'bold', fontSize: '10px', height: 20 }} />;
      default:
        return <Chip label={status} size="small" sx={{ fontSize: '10px', height: 20 }} />;
    }
  };

  const getStatusBadge = (status) => {
    let bgColor = '#f1f5f9';
    let textColor = '#64748b';
    
    if (status === 'P') {
      bgColor = '#dcfce7'; // Light Green
      textColor = '#15803d'; // Dark Green
    } else if (status === 'A') {
      bgColor = '#fee2e2'; // Light Red
      textColor = '#b91c1c'; // Dark Red
    } else if (status === 'WO') {
      bgColor = '#f3e8ff'; // Light Purple
      textColor = '#7e22ce'; // Dark Purple
    }
    
    return (
      <Box sx={{
        width: 25,
        height: 25,
        borderRadius: '50%',
        bgcolor: bgColor,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 'bold',
        mx: 'auto',
        userSelect: 'none'
      }}>
        {status}
      </Box>
    );
  };

  const getAvatarColor = (name) => {
    if (!name) return '#4f46e5';
    const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <AdminLayout>
      {/* 1. Sleek Outside Header Banner */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{ p: 0.6, borderRadius: 2, bgcolor: '#e0e7ff', color: '#4f46e5', display: 'flex' }}>
              <CalendarIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit', letterSpacing: '-0.3px', fontSize: { xs: '20px', sm: '26px' } }}>
              Attendance & Activity Logs
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '13px', mt: 0.8 }}>
            Track real-time check-ins, monthly attendance grids, selfie biometrics, and GPS coordinates.
          </Typography>
        </Box>
      </Box>

      {/* 2. Operations & Controls Card */}
      <Card sx={{ 
        p: { xs: 2.5, sm: 3.5 }, 
        mb: 4, 
        borderRadius: 4, 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)', 
        border: '1px solid #f1f5f9',
        bgcolor: '#fff'
      }}>
        <Grid container spacing={2.5} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            {/* Segmented Summary/Detail Tabs */}
            <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', p: 0.5, borderRadius: 2.5, width: 'fit-content' }}>
              <Button
                onClick={() => { setViewTab('summary'); fetchAttendanceLogs(); }}
                sx={{
                  px: 3,
                  py: 0.8,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12px',
                  fontFamily: 'Outfit',
                  bgcolor: viewTab === 'summary' ? '#fff' : 'transparent',
                  color: viewTab === 'summary' ? '#1e293b' : '#64748b',
                  boxShadow: viewTab === 'summary' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  '&:hover': { bgcolor: viewTab === 'summary' ? '#fff' : 'rgba(0,0,0,0.02)' }
                }}
              >
                Summary Grid
              </Button>
              <Button
                onClick={() => { setViewTab('detail'); fetchAttendanceLogs(); }}
                sx={{
                  px: 3,
                  py: 0.8,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12px',
                  fontFamily: 'Outfit',
                  bgcolor: viewTab === 'detail' ? '#fff' : 'transparent',
                  color: viewTab === 'detail' ? '#1e293b' : '#64748b',
                  boxShadow: viewTab === 'detail' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  '&:hover': { bgcolor: viewTab === 'detail' ? '#fff' : 'rgba(0,0,0,0.02)' }
                }}
              >
                Detailed Logs
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            {/* Month Dropdown Selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #e2e8f0', borderRadius: 2.5, p: '6px 14px', bgcolor: '#f8fafc' }}>
              <CalendarIcon sx={{ color: '#64748b', fontSize: 16 }} />
              
              <TextField
                select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                variant="standard"
                InputProps={{ disableUnderline: true, style: { fontSize: '13px', fontWeight: 700, fontFamily: 'Outfit', color: '#1e293b' } }}
              >
                {months.map(m => (
                  <MenuItem key={m.value} value={m.value} style={{ fontSize: '13px', fontFamily: 'Inter' }}>{m.label}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                variant="standard"
                InputProps={{ disableUnderline: true, style: { fontSize: '13px', fontWeight: 700, fontFamily: 'Outfit', color: '#1e293b' } }}
              >
                {years.map(y => (
                  <MenuItem key={y} value={y} style={{ fontSize: '13px', fontFamily: 'Inter' }}>{y}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5, borderColor: '#f1f5f9' }} />

        {/* Action Buttons: Filter, Export, Import, Template */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '12.5px' }}>
            Actions & Export Options
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
            <Button
              variant="outlined"
              onClick={handleExportExcel}
              disabled={exportingExcel || logs.length === 0}
              startIcon={<ExportIcon sx={{ fontSize: 15 }} />}
              sx={{
                borderColor: '#bfdbfe',
                color: '#2563eb',
                bgcolor: '#eff6ff',
                borderRadius: 2.2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '12px',
                fontFamily: 'Outfit',
                px: 2.5,
                height: 36,
                boxShadow: 'none',
                '&:hover': { borderColor: '#93c5fd', bgcolor: '#dbeafe', boxShadow: 'none' }
              }}
            >
              {exportingExcel ? <CircularProgress size={14} color="inherit" /> : 'Export Excel'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ImportIcon sx={{ fontSize: 15 }} />}
              sx={{
                borderColor: '#bbf7d0',
                color: '#16a34a',
                bgcolor: '#f0fdf4',
                borderRadius: 2.2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '12px',
                fontFamily: 'Outfit',
                px: 2.5,
                height: 36,
                boxShadow: 'none',
                '&:hover': { borderColor: '#86efac', bgcolor: '#dcfce7', boxShadow: 'none' }
              }}
            >
              Import CSV
            </Button>

            <Button
              variant="outlined"
              startIcon={<TemplateIcon sx={{ fontSize: 15 }} />}
              sx={{
                borderColor: '#e9d5ff',
                color: '#7e22ce',
                bgcolor: '#faf5ff',
                borderRadius: 2.2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '12px',
                fontFamily: 'Outfit',
                px: 2.5,
                height: 36,
                boxShadow: 'none',
                '&:hover': { borderColor: '#d8b4fe', bgcolor: '#f3e8ff', boxShadow: 'none' }
              }}
            >
              Get Template
            </Button>
          </Box>
        </Box>
      </Card>

      {/* 2. Detailed View Filters (Only shown in Detail tab) */}
      {viewTab === 'detail' && (
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 3.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Box component="form" onSubmit={handleFilterSubmit}>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Employee"
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                  InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
                sx={{
                  height: 38,
                  borderRadius: 2,
                  fontFamily: 'Outfit',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  textTransform: 'none',
                  bgcolor: '#4f46e5',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#4338ca', boxShadow: 'none' }
                }}
              >
                Search Detailed Logs
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* 3. Report Content Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : logs.length === 0 && viewTab === 'detail' ? (
        <Paper sx={{ p: 6, textAlign: 'center', color: '#64748b', borderRadius: 3.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Typography variant="body1" sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px' }}>
            No attendance records found for the selected filters.
          </Typography>
        </Paper>
      ) : viewTab === 'summary' ? (
        
        /* SUMMARY VIEW: Monthly Attendance Calendar Grid with Sticky Columns */
        <Box sx={{ width: '100%' }}>
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: 3.5, 
              boxShadow: '0 4px 20px -2px rgba(50, 50, 93, 0.01), 0 2px 8px -1px rgba(0, 0, 0, 0.01)', 
              border: '1px solid #e2e8f0', 
              overflowX: 'auto',
              maxWidth: '100%',
              bgcolor: '#fff'
            }}
          >
            <Table size="small" sx={{ borderCollapse: 'separate' }}>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {/* Sticky headers for employee descriptors */}
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', position: 'sticky', left: 0, zIndex: 12, bgcolor: '#f8fafc', borderRight: '1px solid #e2e8f0', minWidth: 50 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', position: 'sticky', left: 50, zIndex: 12, bgcolor: '#f8fafc', borderRight: '1px solid #e2e8f0', minWidth: 180 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', position: 'sticky', left: 230, zIndex: 12, bgcolor: '#f8fafc', borderRight: '1px solid #e2e8f0', minWidth: 120 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', position: 'sticky', left: 350, zIndex: 12, bgcolor: '#f8fafc', borderRight: '1px solid #e2e8f0', minWidth: 110 }}>Emp Status</TableCell>
                  
                  {/* Scrolling Daily Date headers */}
                  {days.map(day => (
                    <TableCell 
                      key={day.dayNumber} 
                      align="center" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: day.isWeekend ? '#7e22ce' : '#475569', 
                        fontFamily: 'Outfit', 
                        fontSize: '11px', 
                        minWidth: 42, 
                        bgcolor: day.isWeekend ? '#faf5ff' : 'transparent',
                        borderRight: '1px solid #f1f5f9'
                      }}
                    >
                      <Box sx={{ fontSize: '11px', lineHeight: 1.1 }}>{day.dayNumber}</Box>
                      <Box sx={{ fontSize: '8.5px', color: day.isWeekend ? '#a855f7' : '#94a3b8', fontWeight: 500, mt: 0.2 }}>{day.dayName}</Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp, index) => {
                  const deptName = emp.department || 'STORE';
                  const empStatus = emp.status || 'Active';
                  
                  return (
                    <TableRow key={emp.id} hover>
                      {/* Sticky Index badge */}
                      <TableCell sx={{ position: 'sticky', left: 0, zIndex: 10, bgcolor: '#fff', borderRight: '1px solid #e2e8f0', p: 1.2 }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                          {index + 1}
                        </Box>
                      </TableCell>

                      {/* Sticky Employee Avatar and Code */}
                      <TableCell sx={{ position: 'sticky', left: 50, zIndex: 10, bgcolor: '#fff', borderRight: '1px solid #e2e8f0', p: 1.2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '11px', bgcolor: getAvatarColor(emp.firstName), fontWeight: 'bold', fontFamily: 'Outfit' }}>
                            {emp.firstName ? emp.firstName[0].toUpperCase() : 'E'}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b', fontFamily: 'Outfit', lineHeight: 1.2 }}>
                              {emp.firstName} {emp.lastName}
                            </Typography>
                            <Typography sx={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'Inter', mt: 0.1 }}>
                              {emp.employeeCode}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Sticky Department Tag */}
                      <TableCell sx={{ position: 'sticky', left: 230, zIndex: 10, bgcolor: '#fff', borderRight: '1px solid #e2e8f0', p: 1.2 }}>
                        <Chip 
                          label={deptName} 
                          size="small" 
                          sx={{ 
                            bgcolor: '#f1f5f9', 
                            color: '#475569', 
                            fontSize: '10px', 
                            fontWeight: 'bold', 
                            height: 20, 
                            borderRadius: '6px',
                            fontFamily: 'Outfit',
                            textTransform: 'uppercase'
                          }} 
                        />
                      </TableCell>

                      {/* Sticky Employee Status Tag */}
                      <TableCell sx={{ position: 'sticky', left: 350, zIndex: 10, bgcolor: '#fff', borderRight: '1px solid #e2e8f0', p: 1.2 }}>
                        <Chip 
                          label={empStatus} 
                          size="small" 
                          sx={{ 
                            bgcolor: empStatus === 'Active' ? '#dcfce7' : '#f1f5f9', 
                            color: empStatus === 'Active' ? '#15803d' : '#64748b', 
                            fontSize: '10px', 
                            fontWeight: 'bold', 
                            height: 20, 
                            borderRadius: '6px',
                            fontFamily: 'Outfit'
                          }} 
                        />
                      </TableCell>

                      {/* Scrolling Daily Status badges */}
                      {days.map(day => {
                        const dailyLog = logsMap[emp.employeeCode]?.[day.dateString];
                        let statusChar = 'NA';
                        
                        const todayStr = formatLocalDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                        const isFuture = day.dateString > todayStr;
                        
                        if (dailyLog) {
                          if (dailyLog.status === 'ABSENT') {
                            statusChar = 'A';
                          } else {
                            statusChar = 'P'; // PRESENT, LATE, HALF_DAY
                          }
                        } else {
                          if (isFuture) {
                            statusChar = 'NA';
                          } else {
                            statusChar = day.isWeekend ? 'WO' : 'A'; // Absent if they missed check-in on a working day
                          }
                        }
                        
                        return (
                          <TableCell 
                            key={day.dayNumber} 
                            align="center" 
                            sx={{ 
                              bgcolor: day.isWeekend ? '#faf5ff' : 'transparent', 
                              p: 0.5,
                              borderRight: '1px solid #f1f5f9'
                            }}
                          >
                            {getStatusBadge(statusChar)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
            <Typography sx={{ fontSize: '12.5px', color: '#64748b', fontFamily: 'Inter' }}>
              Showing 1-{employees.length} of {employees.length} employees
            </Typography>
          </Box>
        </Box>

      ) : (
        
        /* DETAIL VIEW: Daily Log Lists with Selfie Audits & GPS Details */
        <>
          {/* Desktop Table View (sm & up) */}
          <TableContainer 
            component={Paper} 
            sx={{ 
              display: { xs: 'none', sm: 'block' }, 
              borderRadius: 3.5, 
              boxShadow: '0 4px 20px -2px rgba(50, 50, 93, 0.01), 0 2px 8px -1px rgba(0, 0, 0, 0.01)', 
              border: '1px solid #e2e8f0', 
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Emp Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Check In</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>In Selfie</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Check Out</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Out Selfie</TableCell>
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
                    <TableCell sx={{ fontWeight: 600, color: '#4f46e5', fontFamily: 'Inter', fontSize: '13px' }}>{log.employeeCode}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: '13.5px' }}>{log.employeeName}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{log.attendanceDate}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>{formatTime(log.checkIn)}</TableCell>
                    <TableCell>
                      {log.checkInSelfie ? (
                        <Avatar
                          src={log.checkInSelfie}
                          variant="rounded"
                          sx={{ width: 32, height: 32, cursor: 'pointer', border: '1px solid #cbd5e1', '&:hover': { opacity: 0.8 } }}
                          onClick={() => {
                            setSelectedLog(log);
                            setAuditOpen(true);
                          }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#2563eb', fontWeight: 500 }}>{formatTime(log.checkOut)}</TableCell>
                    <TableCell>
                      {log.checkOutSelfie ? (
                        <Avatar
                          src={log.checkOutSelfie}
                          variant="rounded"
                          sx={{ width: 32, height: 32, cursor: 'pointer', border: '1px solid #cbd5e1', '&:hover': { opacity: 0.8 } }}
                          onClick={() => {
                            setSelectedLog(log);
                            setAuditOpen(true);
                          }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
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
                          sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                        >
                          <ViewIcon fontSize="small" sx={{ fontSize: 15, color: '#2563eb' }} />
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
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                  bgcolor: '#fff',
                  p: 2.2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 600, color: '#4f46e5', fontSize: '11px', fontFamily: 'Inter' }}>
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
                      sx={{ bgcolor: '#eff6ff', p: 0.6 }}
                    >
                      <ViewIcon sx={{ fontSize: 14, color: '#2563eb' }} />
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
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '11.5px', color: '#16a34a', fontFamily: 'Outfit' }}>{formatTime(log.checkIn)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '10px' }}>Check Out</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '11.5px', color: '#2563eb', fontFamily: 'Outfit' }}>{formatTime(log.checkOut)}</Typography>
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

      {/* 4. Biometric & Geolocation Audit Dialog */}
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
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4f46e5', fontFamily: 'Outfit' }}>{selectedLog.employeeCode}</Typography>
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#16a34a', mb: 2, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2563eb', mb: 2, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
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
              bgcolor: '#4f46e5',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#4338ca',
                boxShadow: 'none'
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
