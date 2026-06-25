import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import API from '../api';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Card,
  Chip,
  Divider,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  PinDrop as PinIcon,
  Close as CloseIcon,
  Badge as BadgeIcon,
  AccountBalance as BankIcon,
  VpnKey as PasswordIcon,
} from '@mui/icons-material';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog Open state
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Reset Password states
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmployee, setResetEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joiningDate: '',
    username: '', // Username for associated account
    role: 'ROLE_EMPLOYEE',
    customLatitude: '',
    customLongitude: '',
    customRadiusMeters: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async (searchVal = '') => {
    setLoading(true);
    try {
      const res = await API.get(`/employees${searchVal ? `?search=${searchVal}` : ''}`);
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch employee profiles');
    } finally {
      setLoading(false);
    }
  };
  const handleOpenReset = (emp) => {
    setResetEmployee(emp);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
    setResetSubmitting(false);
    setResetDialogOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    setResetSubmitting(true);
    try {
      await API.post(`/employees/${resetEmployee.id}/reset-password`, {
        newPassword
      });
      setResetSuccess('Employee password reset successfully!');
      setTimeout(() => {
        setResetDialogOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setResetError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setResetSubmitting(false);
    }
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees(searchTerm);
  };

  const handleOpenCreate = () => {
    setEditMode(false);
    setForm({
      employeeCode: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      joiningDate: new Date().toISOString().split('T')[0],
      username: '',
      role: 'ROLE_EMPLOYEE',
      customLatitude: '',
      customLongitude: '',
      customRadiusMeters: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      assignedShift: 'General Shift (10:00 AM - 06:30 PM)',
    });
    setError('');
    setOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditMode(true);
    setCurrentId(emp.id);
    setForm({
      employeeCode: emp.employeeCode || '',
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || '',
      designation: emp.designation || '',
      joiningDate: emp.joiningDate || '',
      username: emp.username || '',
      role: emp.role || 'ROLE_EMPLOYEE',
      customLatitude: emp.customLatitude !== null && emp.customLatitude !== undefined ? emp.customLatitude : '',
      customLongitude: emp.customLongitude !== null && emp.customLongitude !== undefined ? emp.customLongitude : '',
      customRadiusMeters: emp.customRadiusMeters !== null && emp.customRadiusMeters !== undefined ? emp.customRadiusMeters : '',
      bankName: emp.bankName || '',
      accountNumber: emp.accountNumber || '',
      ifscCode: emp.ifscCode || '',
      branchName: emp.branchName || '',
      assignedShift: emp.assignedShift || 'General Shift (10:00 AM - 06:30 PM)',
    });
    setError('');
    setOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Auto-generate username from email prefix if empty during create
    let payload = { ...form };
    if (!editMode && !payload.username) {
      payload.username = payload.email.split('@')[0] + "_" + Math.floor(100 + Math.random() * 900);
    }

    payload.customLatitude = payload.customLatitude !== '' ? parseFloat(payload.customLatitude) : null;
    payload.customLongitude = payload.customLongitude !== '' ? parseFloat(payload.customLongitude) : null;
    payload.customRadiusMeters = payload.customRadiusMeters !== '' ? parseFloat(payload.customRadiusMeters) : null;

    try {
      if (editMode) {
        await API.put(`/employees/${currentId}`, payload);
      } else {
        await API.post('/employees', payload);
      }
      setOpen(false);
      fetchEmployees(searchTerm);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error saving employee details');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee? This will permanently delete their account and history.')) {
      try {
        await API.delete(`/employees/${id}`);
        fetchEmployees(searchTerm);
      } catch (err) {
        console.error(err);
        alert('Failed to delete employee profile');
      }
    }
  };

  const getAvatarColor = (name) => {
    if (!name) return '#3b82f6';
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getDepartmentColor = (dept) => {
    if (!dept) return { bg: '#f1f5f9', color: '#475569' };
    const d = dept.toUpperCase();
    if (d.includes('IT') || d.includes('TECH') || d.includes('ENG')) {
      return { bg: '#eff6ff', color: '#2563eb' }; // Blue
    } else if (d.includes('HR') || d.includes('PEOPLE')) {
      return { bg: '#faf5ff', color: '#7e22ce' }; // Purple
    } else if (d.includes('SALES') || d.includes('MKT') || d.includes('MARKET')) {
      return { bg: '#fffbeb', color: '#d97706' }; // Amber
    } else if (d.includes('FIN') || d.includes('ACC')) {
      return { bg: '#f0fdf4', color: '#16a34a' }; // Green
    }
    return { bg: '#f8fafc', color: '#475569' }; // Default gray
  };

  return (
    <AdminLayout>
      {/* 1. Header Banner */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{ p: 0.6, borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb', display: 'flex' }}>
              <PeopleIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit', letterSpacing: '-0.3px', fontSize: { xs: '20px', sm: '26px' } }}>
              Employees Directory
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '13px', mt: 0.8 }}>
            Add, update, and manage employee profiles, custom geofences, and roles.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={handleOpenCreate}
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
          Add Employee
        </Button>
      </Box>

      {/* 2. Sleek Search Bar */}
      <Paper
        component="form"
        onSubmit={handleSearchSubmit}
        sx={{ 
          p: '6px 12px', 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4, 
          borderRadius: 3, 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)', 
          border: '1px solid #f1f5f9',
          bgcolor: '#fff'
        }}
      >
        <SearchIcon sx={{ color: '#94a3b8', mr: 1.5, fontSize: 20 }} />
        <TextField
          fullWidth
          size="small"
          placeholder="Search by code, name, department, designation, or email..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{ 
            style: { fontSize: '13px', fontFamily: 'Inter' }
          }}
          sx={{ 
            '& fieldset': { border: 'none' } 
          }}
        />
        <Button 
          type="submit" 
          variant="contained"
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            fontFamily: 'Outfit',
            fontWeight: 700,
            fontSize: '11.5px',
            bgcolor: '#1e293b',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#0f172a', boxShadow: 'none' }
          }}
        >
          Search
        </Button>
      </Paper>

      {/* 3. Employees Data Container */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : employees.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', color: '#64748b', borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '15px', color: '#475569' }}>
            No employee profiles found
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, fontFamily: 'Inter', fontSize: '12.5px' }}>
            Add a new employee to get started.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Desktop Table View (sm & up) */}
          <TableContainer 
            component={Paper} 
            sx={{ 
              display: { xs: 'none', sm: 'block' }, 
              borderRadius: 4, 
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)', 
              border: '1px solid #f1f5f9', 
              overflow: 'hidden',
              bgcolor: '#fff'
            }}
          >
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px', pl: 3 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px' }}>Designation</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px' }}>Custom Geofence</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px' }}>Shift</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px', pr: 3 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) => {
                  const deptColors = getDepartmentColor(emp.department);
                  const hasCustomGeofence = emp.customLatitude !== null && emp.customLongitude !== null;
                  
                  return (
                    <TableRow key={emp.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Code */}
                      <TableCell sx={{ fontWeight: 700, color: '#2563eb', fontFamily: 'Inter', fontSize: '12.5px', pl: 3 }}>
                        {emp.employeeCode}
                      </TableCell>
                      
                      {/* Avatar & Name */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '12px', bgcolor: getAvatarColor(emp.firstName), fontWeight: 'bold', fontFamily: 'Outfit' }}>
                            {emp.firstName ? emp.firstName[0].toUpperCase() : 'E'}
                          </Avatar>
                          <Typography sx={{ fontWeight: 'bold', color: '#0f172a', fontFamily: 'Outfit', fontSize: '13.5px' }}>
                            {emp.firstName} {emp.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      {/* Email */}
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '12.5px', color: '#475569' }}>
                        {emp.email}
                      </TableCell>
                      
                      {/* Department Chip */}
                      <TableCell>
                        <Chip
                          label={emp.department || 'N/A'}
                          size="small"
                          sx={{
                            bgcolor: deptColors.bg,
                            color: deptColors.color,
                            fontSize: '10.5px',
                            fontWeight: 'bold',
                            borderRadius: '6px',
                            fontFamily: 'Outfit',
                            textTransform: 'uppercase',
                          }}
                        />
                      </TableCell>
                      
                      {/* Designation */}
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '12.5px', color: '#475569', fontWeight: 500 }}>
                        {emp.designation || '-'}
                      </TableCell>
                      
                      {/* Custom Geofence Status */}
                      <TableCell>
                        <Chip
                          label={hasCustomGeofence ? 'Custom' : 'System Default'}
                          size="small"
                          icon={hasCustomGeofence ? <PinIcon sx={{ fontSize: '11.5px !important' }} /> : undefined}
                          sx={{
                            bgcolor: hasCustomGeofence ? '#fdf2f8' : '#f8fafc',
                            color: hasCustomGeofence ? '#db2777' : '#64748b',
                            fontSize: '10.5px',
                            fontWeight: 'bold',
                            borderRadius: '6px',
                            fontFamily: 'Outfit',
                            border: hasCustomGeofence ? '1px solid #fbcfe8' : '1px solid #e2e8f0',
                          }}
                        />
                      </TableCell>
                      
                      {/* Shift Timing */}
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '12.5px', color: '#6366f1', fontWeight: 600 }}>
                        {emp.assignedShift || 'General Shift (10:00 AM - 06:30 PM)'}
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="Reset Password">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenReset(emp)} 
                              sx={{ color: '#d97706', bgcolor: '#fef3c7', '&:hover': { bgcolor: '#fde68a' } }}
                            >
                              <PasswordIcon fontSize="small" sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Profile">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenEdit(emp)} 
                              sx={{ color: '#2563eb', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                            >
                              <EditIcon fontSize="small" sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Profile">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(emp.id)} 
                              sx={{ color: '#dc2626', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                            >
                              <DeleteIcon fontSize="small" sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Cards List View (xs only) */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 2 }}>
            {employees.map((emp) => {
              const deptColors = getDepartmentColor(emp.department);
              const hasCustomGeofence = emp.customLatitude !== null && emp.customLongitude !== null;
              
              return (
                <Card 
                  key={emp.id} 
                  sx={{ 
                    borderRadius: 3.5, 
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)',
                    bgcolor: '#fff',
                    p: 2.2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
                    <Typography sx={{ fontWeight: 700, color: '#2563eb', fontSize: '11px', fontFamily: 'Inter' }}>
                      {emp.employeeCode}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => handleOpenReset(emp)} sx={{ bgcolor: '#fef3c7', color: '#d97706', p: 0.6 }}>
                        <PasswordIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenEdit(emp)} sx={{ bgcolor: '#eff6ff', color: '#2563eb', p: 0.6 }}>
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(emp.id)} sx={{ bgcolor: '#fef2f2', color: '#dc2626', p: 0.6 }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '13px', bgcolor: getAvatarColor(emp.firstName), fontWeight: 'bold', fontFamily: 'Outfit' }}>
                      {emp.firstName ? emp.firstName[0].toUpperCase() : 'E'}
                    </Avatar>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a', fontFamily: 'Outfit' }}>
                      {emp.firstName} {emp.lastName}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px', fontFamily: 'Inter', mb: 2 }}>
                    ✉️ {emp.email}
                  </Typography>

                  <Divider sx={{ my: 1.5, borderColor: '#f1f5f9' }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '9px', fontWeight: 600 }}>Department</Typography>
                      <Chip
                        label={emp.department || 'N/A'}
                        size="small"
                        sx={{
                          bgcolor: deptColors.bg,
                          color: deptColors.color,
                          fontSize: '9.5px',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          fontFamily: 'Outfit',
                          height: 18,
                          mt: 0.2
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '9px', fontWeight: 600 }}>Designation</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '11.5px', color: '#334155', fontFamily: 'Outfit', mt: 0.2 }}>{emp.designation || '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '9px', fontWeight: 600 }}>Geofence</Typography>
                      <Chip
                        label={hasCustomGeofence ? 'Custom' : 'Default'}
                        size="small"
                        sx={{
                          bgcolor: hasCustomGeofence ? '#fdf2f8' : '#f8fafc',
                          color: hasCustomGeofence ? '#db2777' : '#64748b',
                          fontSize: '9.5px',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          fontFamily: 'Outfit',
                          height: 18,
                          mt: 0.2,
                          border: hasCustomGeofence ? '1px solid #fbcfe8' : '1px solid #e2e8f0'
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '9px', fontWeight: 600 }}>Shift</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '11.5px', color: '#6366f1', fontFamily: 'Outfit', mt: 0.2 }}>
                        {emp.assignedShift ? emp.assignedShift.split(' (')[0] : 'General Shift'}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
        </>
      )}

      {/* 4. Cohesive Form Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, p: 1.5 } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold', fontFamily: 'Outfit', fontSize: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: '800', fontFamily: 'Outfit', fontSize: '17px', color: '#0f172a' }}>
              {editMode ? 'Edit Employee Details' : 'Register New Employee'}
            </Typography>
            <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2.5, borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5, fontSize: '12px' }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="employeeCode"
                  label="Employee Code"
                  value={form.employeeCode}
                  onChange={handleInputChange}
                  disabled={editMode}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={form.firstName}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={form.lastName}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Phone Number"
                  value={form.phone}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="joiningDate"
                  label="Joining Date"
                  type="date"
                  value={form.joiningDate}
                  onChange={handleInputChange}
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="department"
                  label="Department"
                  value={form.department}
                  onChange={handleInputChange}
                  placeholder="e.g. IT, HR, Sales"
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="designation"
                  label="Designation"
                  value={form.designation}
                  onChange={handleInputChange}
                  placeholder="e.g. Engineer, Director"
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              {!editMode && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="username"
                    label="Username (Optional)"
                    value={form.username}
                    onChange={handleInputChange}
                    helperText="Leave blank to auto-generate from email prefix"
                    InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                    InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                    FormHelperTextProps={{ style: { fontSize: '10px', fontFamily: 'Inter', color: '#94a3b8' } }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  name="role"
                  label="Authorization Role"
                  value={form.role}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                >
                  <MenuItem value="ROLE_EMPLOYEE" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Employee (Standard)</MenuItem>
                  <MenuItem value="ROLE_ADMIN" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Admin (Manager)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  name="assignedShift"
                  label="Assigned Work Shift"
                  value={form.assignedShift || 'General Shift (10:00 AM - 06:30 PM)'}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                >
                  <MenuItem value="General Shift (10:00 AM - 06:30 PM)" style={{ fontSize: '13px', fontFamily: 'Inter' }}>General Shift (10:00 AM - 06:30 PM)</MenuItem>
                  <MenuItem value="Morning Shift (08:00 AM - 04:30 PM)" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Morning Shift (08:00 AM - 04:30 PM)</MenuItem>
                  <MenuItem value="Evening Shift (02:00 PM - 10:30 PM)" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Evening Shift (02:00 PM - 10:30 PM)</MenuItem>
                  <MenuItem value="Night Shift (10:00 PM - 06:30 AM)" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Night Shift (10:00 PM - 06:30 AM)</MenuItem>
                </TextField>
              </Grid>

              {/* Custom Location Section */}
              <Grid item xs={12}>
                <Box sx={{ mt: 1.5, p: 2, bgcolor: '#faf5ff', borderRadius: 3, border: '1px solid #f3e8ff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#7e22ce', display: 'flex', alignItems: 'center', gap: 0.8, fontFamily: 'Outfit', fontSize: '13.5px' }}>
                    <PinIcon sx={{ fontSize: 18 }} /> Custom Geofence Override (Optional)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8b5cf6', display: 'block', mt: 0.5, mb: 2, fontFamily: 'Inter', fontSize: '11px', lineHeight: 1.4 }}>
                    Leave these fields empty to use the system default geofencing bounds. Set values here to lock this specific employee to a unique geofence zone.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        name="customLatitude"
                        label="Latitude"
                        type="number"
                        inputProps={{ step: "any" }}
                        value={form.customLatitude}
                        onChange={handleInputChange}
                        InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', borderRadius: '8px', backgroundColor: '#fff' } }}
                        InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        name="customLongitude"
                        label="Longitude"
                        type="number"
                        inputProps={{ step: "any" }}
                        value={form.customLongitude}
                        onChange={handleInputChange}
                        InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', borderRadius: '8px', backgroundColor: '#fff' } }}
                        InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        name="customRadiusMeters"
                        label="Radius (Meters)"
                        type="number"
                        inputProps={{ min: 1 }}
                        value={form.customRadiusMeters}
                        onChange={handleInputChange}
                        InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', borderRadius: '8px', backgroundColor: '#fff' } }}
                        InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Salary & Bank Details Section */}
              <Grid item xs={12}>
                <Box sx={{ mt: 1.5, p: 2, bgcolor: '#f0fdfa', borderRadius: 3, border: '1px solid #ccfbf1' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0d9488', display: 'flex', alignItems: 'center', gap: 0.8, fontFamily: 'Outfit', fontSize: '13.5px' }}>
                    <BankIcon sx={{ fontSize: 18 }} /> Salary & Bank Account Details
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#0f766e', display: 'block', mt: 0.5, mb: 2, fontFamily: 'Inter', fontSize: '11px', lineHeight: 1.4 }}>
                    Enter official payroll deposit account details for the monthly salary disbursement.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="bankName"
                        label="Bank Name"
                        value={form.bankName}
                        onChange={handleInputChange}
                        InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', borderRadius: '8px', backgroundColor: '#fff' } }}
                        InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="accountNumber"
                        label="Account Number"
                        value={form.accountNumber}
                        onChange={handleInputChange}
                        InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', borderRadius: '8px', backgroundColor: '#fff' } }}
                        InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="ifscCode"
                        label="IFSC Code"
                        value={form.ifscCode}
                        onChange={handleInputChange}
                        InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', borderRadius: '8px', backgroundColor: '#fff' } }}
                        InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="branchName"
                        label="Branch Name"
                        value={form.branchName}
                        onChange={handleInputChange}
                        InputProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter', borderRadius: '8px', backgroundColor: '#fff' } }}
                        InputLabelProps={{ style: { fontSize: '12px', fontFamily: 'Inter' } }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
            
            {!editMode && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <Typography variant="body2" color="#475569" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <BadgeIcon sx={{ fontSize: 16, color: '#2563eb' }} /> Temporary Credential Setup
                </Typography>
                <Typography variant="body2" color="#475569" sx={{ fontWeight: 600, fontFamily: 'Inter', fontSize: '12px', mt: 0.5 }}>
                  First Sign-in Password: <span style={{ color: '#2563eb', fontWeight: 'bold' }}>Welcome@123</span>
                </Typography>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pt: 2, pb: 1, gap: 1 }}>
            <Button 
              onClick={() => setOpen(false)} 
              variant="outlined"
              sx={{ 
                textTransform: 'none', 
                borderRadius: 2.5, 
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
              sx={{ 
                textTransform: 'none', 
                borderRadius: 2.5,
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
              Save Employee
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 5. Reset Password Dialog */}
      <Dialog 
        open={resetDialogOpen} 
        onClose={() => setResetDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: 4, p: 1.5 } }}
      >
        <form onSubmit={handleResetSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold', fontFamily: 'Outfit', fontSize: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: '800', fontFamily: 'Outfit', fontSize: '17px', color: '#0f172a' }}>
              Reset Password
            </Typography>
            <IconButton onClick={() => setResetDialogOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2.5, borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
            <Typography sx={{ color: '#64748b', fontSize: '12.5px', fontFamily: 'Inter', mb: 2.5 }}>
              Enter a new password for <strong>{resetEmployee ? `${resetEmployee.firstName} ${resetEmployee.lastName || ''}` : ''}</strong> (Code: {resetEmployee?.employeeCode}).
            </Typography>

            {resetError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '11.5px' }}>
                {resetError}
              </Alert>
            )}
            {resetSuccess && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: '11.5px' }}>
                {resetSuccess}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                required
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
              />
              <TextField
                required
                fullWidth
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', borderRadius: '10px' } }}
                InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
              />
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pt: 2, pb: 1, gap: 1 }}>
            <Button 
              onClick={() => setResetDialogOpen(false)} 
              variant="outlined"
              sx={{ 
                textTransform: 'none', 
                borderRadius: 2.5, 
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
              disabled={resetSubmitting}
              sx={{ 
                textTransform: 'none', 
                borderRadius: 2.5,
                px: 3,
                fontFamily: 'Outfit',
                fontWeight: 700,
                fontSize: '12px',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                boxShadow: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                  boxShadow: 'none',
                }
              }}
            >
              {resetSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminEmployees;
