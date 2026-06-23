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
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  CloudUpload as ImportIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';

const monthsList = [
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
  { value: 11, label: 'December' },
];

const currentYearVal = new Date().getFullYear();
const yearsList = Array.from({ length: 5 }, (_, i) => currentYearVal - 2 + i);

const AdminReports = () => {
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState({ pdf: false, excel: false });
  const [showFilters, setShowFilters] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmp, setSelectedEmp] = useState('');
  const [department, setDepartment] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/employees');
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Failed to load employees list", err);
    }
  };

  // Calculate startDate and endDate when month/year changes
  useEffect(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const startStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const endStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    setStartDate(startStr);
    setEndDate(endStr);
  }, [selectedMonth, selectedYear]);

  // Load report preview automatically when date range or filters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate, selectedEmp, department]);

  const fetchReportData = async () => {
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
      setLogs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch reports logs", err);
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
      link.download = `Monthly_Attendance_Report_${selectedYear}_${selectedMonth + 1}.pdf`;
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
      link.download = `Monthly_Attendance_Report_${selectedYear}_${selectedMonth + 1}.xlsx`;
      link.click();
    } catch (err) {
      console.error("Failed to export Excel", err);
    } finally {
      setExportLoading((prev) => ({ ...prev, excel: false }));
    }
  };

  // Generate days headers
  const getDaysArray = () => {
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dateObj = new Date(selectedYear, selectedMonth, dayNum);
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        dayNum,
        weekdayLabel: `${dayNum} ${weekday}`
      };
    });
  };

  const daysArray = getDaysArray();

  // Map employees to daily grids
  const getMappedRows = () => {
    // Filter employees locally if a specific employee filter is set
    const filteredEmployees = employees.filter(emp => {
      if (selectedEmp && emp.id !== selectedEmp) return false;
      if (department && !(emp.department || '').toLowerCase().includes(department.toLowerCase())) return false;
      return true;
    });

    return filteredEmployees.map((emp) => {
      const empLogs = logs.filter(log => log.employeeCode === emp.employeeCode || log.employeeId === emp.id);
      
      const dailyStatus = {};
      daysArray.forEach(({ dayNum }) => {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const logForDay = empLogs.find(l => l.attendanceDate === dateStr);
        
        if (logForDay) {
          if (logForDay.status === 'LATE') {
            dailyStatus[dayNum] = 'L';
          } else if (logForDay.status === 'ABSENT') {
            dailyStatus[dayNum] = 'A';
          } else {
            dailyStatus[dayNum] = 'P';
          }
        } else {
          // Check weekend
          const dateObj = new Date(selectedYear, selectedMonth, dayNum);
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
          
          if (isWeekend) {
            dailyStatus[dayNum] = 'WO';
          } else {
            const today = new Date();
            today.setHours(0,0,0,0);
            if (dateObj > today) {
              dailyStatus[dayNum] = 'NA';
            } else {
              dailyStatus[dayNum] = 'A'; // Past absent
            }
          }
        }
      });

      return {
        id: emp.id,
        code: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.department || 'General',
        status: 'Active',
        dailyStatus
      };
    });
  };

  const allMappedRows = getMappedRows();
  const paginatedRows = allMappedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getCellBadge = (status) => {
    const baseStyle = {
      width: 28,
      height: 28,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 'bold',
      fontFamily: 'Inter',
      margin: 'auto'
    };

    switch (status) {
      case 'P':
        return <Box sx={{ ...baseStyle, bgcolor: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' }}>P</Box>;
      case 'A':
        return <Box sx={{ ...baseStyle, bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' }}>A</Box>;
      case 'L':
        return <Box sx={{ ...baseStyle, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>L</Box>;
      case 'WO':
        return <Box sx={{ ...baseStyle, bgcolor: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>WO</Box>;
      case 'NA':
      default:
        return <Box sx={{ ...baseStyle, bgcolor: '#f8fafc', color: '#cbd5e1', border: '1px dashed #e2e8f0' }}>-</Box>;
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
            Monthly Attendance Ledger
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontFamily: 'Inter', fontSize: { xs: '11px', sm: '13px' }, maxWidth: '600px', display: { xs: 'none', sm: 'block' } }}>
            View, audit, and analyze the complete daily attendance grid matrix for all active enterprise employees.
          </Typography>
        </Box>
      </Paper>

      {/* Control Buttons panel */}
      <Box sx={{ mb: 3.5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: '100%', justifyContent: { xs: 'stretch', sm: 'flex-start' } }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#e2e8f0',
              color: '#334155',
              fontWeight: 700,
              fontSize: '12px',
              fontFamily: 'Outfit',
              backgroundColor: showFilters ? '#f1f5f9' : '#fff',
              '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
              flexGrow: { xs: 1, sm: 0 }
            }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={exportLoading.excel || exportLoading.pdf ? <CircularProgress size={12} color="inherit" /> : <ExcelIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportExcel}
            disabled={exportLoading.excel || exportLoading.pdf || logs.length === 0}
            sx={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '12px',
              fontFamily: 'Outfit',
              boxShadow: 'none',
              '&:hover': { background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)', boxShadow: 'none' },
              flexGrow: { xs: 1, sm: 0 }
            }}
          >
            Export Ledger
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ImportIcon sx={{ fontSize: 14 }} />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#e2e8f0',
              color: '#475569',
              fontWeight: 700,
              fontSize: '12px',
              fontFamily: 'Outfit',
              backgroundColor: '#fff',
              '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
              flexGrow: { xs: 1, sm: 0 }
            }}
          >
            Import
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<TemplateIcon sx={{ fontSize: 14 }} />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#e2e8f0',
              color: '#475569',
              fontWeight: 700,
              fontSize: '12px',
              fontFamily: 'Outfit',
              backgroundColor: '#fff',
              '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
              flexGrow: { xs: 1, sm: 0 }
            }}
          >
            Template
          </Button>
        </Box>
      </Box>

      {/* Filters Area */}
      {showFilters && (
        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)', bgcolor: '#fff' }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Select Month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter', fontWeight: 600 } }}
              >
                {monthsList.map((m) => (
                  <MenuItem key={m.value} value={m.value} sx={{ fontSize: '13px', fontFamily: 'Inter' }}>
                    {m.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Select Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter', fontWeight: 600 } }}
              >
                {yearsList.map((yr) => (
                  <MenuItem key={yr} value={yr} sx={{ fontSize: '13px', fontFamily: 'Inter' }}>
                    {yr}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Select Employee"
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter', fontWeight: 600 } }}
              >
                <MenuItem value="" sx={{ fontSize: '13px', fontFamily: 'Inter' }}>All Employees</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id} sx={{ fontSize: '13px', fontFamily: 'Inter' }}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter', fontWeight: 600 } }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Grid Matrix Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : allMappedRows.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', color: '#64748b', borderRadius: 3, border: '1px dashed #e2e8f0', bgcolor: '#fff' }}>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '14.5px', color: '#1e293b' }}>No employee records found</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'Inter', mt: 0.5, fontSize: '12.5px' }}>Try altering your search or filters settings above.</Typography>
        </Paper>
      ) : (
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', bgcolor: '#fff', mb: 3.5, overflow: 'hidden' }}>
          {/* Scroll Tip Helper for mobile */}
          <Box sx={{ px: 2, py: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: { xs: 'flex', sm: 'none' }, alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700, fontFamily: 'Inter', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Swipe left / right to view daily matrix ↔
            </Typography>
          </Box>

          <TableContainer 
            sx={{ 
              overflowX: 'auto', 
              maxHeight: '550px',
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 3 }
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', bgcolor: '#f8fafc', py: 1.5, fontSize: '12px', borderBottom: '2px solid #e2e8f0', fontFamily: 'Outfit', minWidth: '40px' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', bgcolor: '#f8fafc', py: 1.5, fontSize: '12px', borderBottom: '2px solid #e2e8f0', fontFamily: 'Outfit', minWidth: '160px' }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', bgcolor: '#f8fafc', py: 1.5, fontSize: '12px', borderBottom: '2px solid #e2e8f0', fontFamily: 'Outfit', minWidth: '110px' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', bgcolor: '#f8fafc', py: 1.5, fontSize: '12px', borderBottom: '2px solid #e2e8f0', fontFamily: 'Outfit', minWidth: '90px' }}>Emp Status</TableCell>
                  
                  {/* Render columns for each day of the month */}
                  {daysArray.map((day) => (
                    <TableCell 
                      key={day.dayNum} 
                      align="center"
                      sx={{ 
                        fontWeight: 'bold', 
                        color: '#475569', 
                        bgcolor: '#f8fafc', 
                        py: 1.5, 
                        fontSize: '11px', 
                        borderBottom: '2px solid #e2e8f0', 
                        fontFamily: 'Inter',
                        minWidth: '44px',
                      }}
                    >
                      {day.weekdayLabel.split(' ')[0]}
                      <Box sx={{ fontSize: '8px', fontWeight: 500, color: '#94a3b8', mt: 0.1 }}>
                        {day.weekdayLabel.split(' ')[1]}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row, idx) => (
                  <TableRow key={row.id || idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ py: 1, fontSize: '12px', fontFamily: 'Inter', color: '#64748b' }}>
                      {page * rowsPerPage + idx + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          sx={{ 
                            width: 26, 
                            height: 26, 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            bgcolor: '#3b82f6',
                            color: '#fff',
                            fontFamily: 'Outfit'
                          }}
                        >
                          {row.firstName ? row.firstName[0].toUpperCase() : 'E'}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit', lineHeight: 1.2 }}>
                            {row.firstName} {row.lastName}
                          </Typography>
                          <Typography noWrap sx={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'Inter', mt: 0.1 }}>
                            {row.code}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Chip 
                        label={row.department} 
                        size="small" 
                        sx={{ 
                          height: 18, 
                          fontSize: '9.5px', 
                          fontWeight: 500, 
                          color: '#475569', 
                          bgcolor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          fontFamily: 'Inter' 
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#22c55e' }} />
                        <Typography sx={{ fontSize: '10.5px', fontWeight: 700, color: '#16a34a', fontFamily: 'Outfit' }}>
                          Active
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    {/* Render badge status cell for each day of the month */}
                    {daysArray.map((day) => (
                      <TableCell 
                        key={day.dayNum} 
                        align="center"
                        sx={{ 
                          p: 0.4, 
                          borderRight: '1px solid #f1f5f9',
                          bgcolor: (new Date(selectedYear, selectedMonth, day.dayNum).getDay() === 0 || new Date(selectedYear, selectedMonth, day.dayNum).getDay() === 6)
                            ? 'rgba(139, 92, 246, 0.02)'
                            : 'transparent'
                        }}
                      >
                        {getCellBadge(row.dailyStatus[day.dayNum])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Bottom Pagination Control */}
          <Box 
            sx={{ 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderTop: '1px solid #e2e8f0', 
              flexWrap: 'wrap', 
              gap: 1.5 
            }}
          >
            <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'Inter' }}>
              Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, allMappedRows.length)} of {allMappedRows.length} employees
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.4, px: 2, fontSize: '11.5px', fontFamily: 'Outfit', fontWeight: 700 }}
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                disabled={(page + 1) * rowsPerPage >= allMappedRows.length}
                onClick={() => setPage(p => p + 1)}
                sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.4, px: 2, fontSize: '11.5px', fontFamily: 'Outfit', fontWeight: 700 }}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Card>
      )}

      {/* Attendance Status Legend */}
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', bgcolor: '#fff', p: { xs: 1.8, sm: 2.5 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 2, fontFamily: 'Outfit', fontSize: { xs: '13px', sm: '15px' } }}>
          Attendance Status Legend
        </Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={4} sm={4} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Inter' }}>P</Box>
              <Typography sx={{ fontSize: '11.5px', color: '#475569', fontWeight: 500, fontFamily: 'Inter' }}>Present</Typography>
            </Box>
          </Grid>
          <Grid item xs={4} sm={4} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Inter' }}>A</Box>
              <Typography sx={{ fontSize: '11.5px', color: '#475569', fontWeight: 500, fontFamily: 'Inter' }}>Absent</Typography>
            </Box>
          </Grid>
          <Grid item xs={4} sm={4} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Inter' }}>L</Box>
              <Typography sx={{ fontSize: '11.5px', color: '#475569', fontWeight: 500, fontFamily: 'Inter' }}>Late</Typography>
            </Box>
          </Grid>
          <Grid item xs={4} sm={4} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Inter' }}>WO</Box>
              <Typography sx={{ fontSize: '11.5px', color: '#475569', fontWeight: 500, fontFamily: 'Inter' }}>Week Off</Typography>
            </Box>
          </Grid>
          <Grid item xs={4} sm={4} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Inter' }}>H</Box>
              <Typography sx={{ fontSize: '11.5px', color: '#475569', fontWeight: 500, fontFamily: 'Inter' }}>Holiday</Typography>
            </Box>
          </Grid>
          <Grid item xs={4} sm={4} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#f8fafc', color: '#cbd5e1', border: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Inter' }}>-</Box>
              <Typography sx={{ fontSize: '11.5px', color: '#475569', fontWeight: 500, fontFamily: 'Inter' }}>Future / -</Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </AdminLayout>
  );
};

export default AdminReports;
