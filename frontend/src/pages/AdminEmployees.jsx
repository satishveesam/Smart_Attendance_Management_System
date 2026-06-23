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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Key as ResetPwIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
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
    basicPay: '',
    hra: '',
    specialAllowance: '',
    deductions: '',
    netTakeHome: '',
    rosterSchedule: '',
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
      joiningDate: new Date().toLocaleDateString('sv-SE'),
      username: '',
      role: 'ROLE_EMPLOYEE',
      customLatitude: '',
      customLongitude: '',
      customRadiusMeters: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      basicPay: '',
      hra: '',
      specialAllowance: '',
      deductions: '',
      netTakeHome: '',
      rosterSchedule: '',
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
      basicPay: emp.basicPay !== null && emp.basicPay !== undefined ? emp.basicPay : '',
      hra: emp.hra !== null && emp.hra !== undefined ? emp.hra : '',
      specialAllowance: emp.specialAllowance !== null && emp.specialAllowance !== undefined ? emp.specialAllowance : '',
      deductions: emp.deductions !== null && emp.deductions !== undefined ? emp.deductions : '',
      netTakeHome: emp.netTakeHome !== null && emp.netTakeHome !== undefined ? emp.netTakeHome : '',
      rosterSchedule: emp.rosterSchedule || '',
    });
    setError('');
    setOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (['basicPay', 'hra', 'specialAllowance', 'deductions'].includes(name)) {
        const bp = parseFloat(updated.basicPay) || 0;
        const hra = parseFloat(updated.hra) || 0;
        const sa = parseFloat(updated.specialAllowance) || 0;
        const ded = parseFloat(updated.deductions) || 0;
        // Keep it empty if all components are empty/unset
        if (updated.basicPay === '' && updated.hra === '' && updated.specialAllowance === '' && updated.deductions === '') {
          updated.netTakeHome = '';
        } else {
          updated.netTakeHome = bp + hra + sa - ded;
        }
      }
      return updated;
    });
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
    payload.basicPay = payload.basicPay !== '' ? parseFloat(payload.basicPay) : null;
    payload.hra = payload.hra !== '' ? parseFloat(payload.hra) : null;
    payload.specialAllowance = payload.specialAllowance !== '' ? parseFloat(payload.specialAllowance) : null;
    payload.deductions = payload.deductions !== '' ? parseFloat(payload.deductions) : null;
    payload.netTakeHome = payload.netTakeHome !== '' ? parseFloat(payload.netTakeHome) : null;

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

  // Reset Password state
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [resetPwEmp, setResetPwEmp] = useState(null);
  const [resetNewPw, setResetNewPw] = useState('');
  const [showResetPw, setShowResetPw] = useState(false);
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const [resetPwError, setResetPwError] = useState('');
  const [resetPwSuccess, setResetPwSuccess] = useState('');

  const handleOpenResetPw = (emp) => {
    setResetPwEmp(emp);
    setResetNewPw('');
    setResetPwError('');
    setResetPwSuccess('');
    setShowResetPw(false);
    setResetPwOpen(true);
  };

  const handleConfirmResetPw = async () => {
    if (!resetNewPw || resetNewPw.length < 6) {
      setResetPwError('New password must be at least 6 characters.');
      return;
    }
    setResetPwLoading(true);
    setResetPwError('');
    try {
      await API.put(`/employees/${resetPwEmp.id}/reset-password`, { newPassword: resetNewPw });
      setResetPwSuccess(`Password for ${resetPwEmp.firstName} reset successfully!`);
      setTimeout(() => { setResetPwOpen(false); setResetPwSuccess(''); }, 2000);
    } catch (err) {
      setResetPwError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setResetPwLoading(false);
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
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.5px', fontSize: { xs: '20px', sm: '28px' } }}>
              Employees Directory
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontFamily: 'Inter', fontSize: { xs: '11px', sm: '13px' }, maxWidth: '600px' }}>
              Add, update, and manage employee profiles, geofences, and access privileges.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={handleOpenCreate}
            sx={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              textTransform: 'none',
              borderRadius: 2,
              px: { xs: 2.5, sm: 3 },
              py: { xs: 1, sm: 1.2 },
              fontFamily: 'Outfit',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
                boxShadow: 'none'
              },
            }}
          >
            Add Employee
          </Button>
        </Box>
      </Paper>

      {/* Search Bar */}
      <Paper
        component="form"
        onSubmit={handleSearchSubmit}
        sx={{ 
          p: '2px 6px', 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3, 
          borderRadius: 2, 
          boxShadow: 'none', 
          border: '1px solid #e2e8f0',
          bgcolor: '#fff'
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search by code, name, department, designation, or email..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{ 
            style: { fontSize: '12.5px', fontFamily: 'Inter' }
          }}
          sx={{ 
            '& fieldset': { border: 'none' } 
          }}
        />
        <IconButton type="submit" sx={{ p: '8px', color: '#64748b' }} aria-label="search">
          <SearchIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Paper>

      {/* Employees Container */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={24} color="primary" />
        </Box>
      ) : employees.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', color: '#64748b', borderRadius: 3, border: '1px dashed #e2e8f0', bgcolor: '#fff' }}>
          <Typography variant="body1" sx={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '14.5px', color: '#1e293b' }}>
            No employee profiles found
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'Inter', mt: 0.5, fontSize: '12.5px' }}>
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
              borderRadius: 3, 
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.01)', 
              border: '1px solid #e2e8f0', 
              overflow: 'hidden' 
            }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Designation</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#0284c7', fontFamily: 'Inter', fontSize: '12.5px' }}>{emp.employeeCode}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit', fontSize: '13px' }}>{`${emp.firstName} ${emp.lastName}`}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '12.5px', color: '#475569' }}>{emp.email}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '12.5px', color: '#475569' }}>{emp.department || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '12.5px', color: '#475569' }}>{emp.designation || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '12.5px', color: '#475569' }}>{emp.phone || '-'}</TableCell>
                    <TableCell align="right" sx={{ py: 0.5 }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(emp)} sx={{ mr: 0.5, color: '#0284c7', bgcolor: '#f0f9ff', '&:hover': { bgcolor: '#e0f2fe' } }}>
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenResetPw(emp)} sx={{ mr: 0.5, color: '#d97706', bgcolor: '#fffbeb', '&:hover': { bgcolor: '#fef3c7' } }} title="Reset Password">
                        <ResetPwIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(emp.id)} sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Cards List View (xs only) */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {employees.map((emp) => (
              <Card 
                key={emp.id} 
                sx={{ 
                  borderRadius: 2.5, 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)',
                  bgcolor: '#fff',
                  p: 1.5
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#0284c7', fontSize: '10.5px', fontFamily: 'Inter' }}>
                    {emp.employeeCode}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleOpenEdit(emp)} sx={{ color: '#0284c7', bgcolor: '#f0f9ff', p: 0.5 }}>
                      <EditIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenResetPw(emp)} sx={{ color: '#d97706', bgcolor: '#fffbeb', p: 0.5 }} title="Reset Password">
                      <ResetPwIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(emp.id)} sx={{ color: '#ef4444', bgcolor: '#fef2f2', p: 0.5 }}>
                      <DeleteIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography sx={{ fontWeight: 800, fontSize: '13.5px', color: '#1e293b', fontFamily: 'Outfit' }}>
                  {`${emp.firstName} ${emp.lastName}`}
                </Typography>
                
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.2, fontSize: '11.5px', fontFamily: 'Inter' }}>
                  ✉️ {emp.email}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '8.5px', textTransform: 'uppercase', fontWeight: 700 }}>Dept</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '11px', color: '#334155', fontFamily: 'Outfit' }}>{emp.department || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '8.5px', textTransform: 'uppercase', fontWeight: 700 }}>Desig</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '11px', color: '#334155', fontFamily: 'Outfit' }}>{emp.designation || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '8.5px', textTransform: 'uppercase', fontWeight: 700 }}>Phone</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '11px', color: '#334155', fontFamily: 'Outfit' }}>{emp.phone || '-'}</Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </>
      )}

      {/* Form Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontFamily: 'Outfit', pb: 1 }}>
          {editMode ? 'Edit Employee Details' : 'Register New Employee'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '12px' }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="employeeCode"
                  label="Employee Code"
                  value={form.employeeCode}
                  onChange={handleInputChange}
                  disabled={editMode}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
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
                    InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                    InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                    FormHelperTextProps={{ style: { fontSize: '10px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                >
                  <MenuItem value="ROLE_EMPLOYEE" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Employee</MenuItem>
                  <MenuItem value="ROLE_ADMIN" style={{ fontSize: '13px', fontFamily: 'Inter' }}>Admin</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#475569', mt: 1, mb: 0.5, fontFamily: 'Outfit' }}>
                  Shift Roster & Schedule
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="rosterSchedule"
                  label="Roster Shift Schedule"
                  placeholder="e.g. General Shift (10:00 AM - 06:30 PM) | Offs: Saturday, Sunday"
                  value={form.rosterSchedule}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#475569', mt: 2, mb: 0.5, fontFamily: 'Outfit' }}>
                  Custom Work Location & Geofencing (Optional)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontFamily: 'Inter', fontSize: '11px' }}>
                  Overrides the default office location settings. Leave empty to use the system default geofence location.
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="customLatitude"
                  label="Custom Latitude"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={form.customLatitude}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="customLongitude"
                  label="Custom Longitude"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={form.customLongitude}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
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
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#475569', mt: 2, mb: 0.5, fontFamily: 'Outfit' }}>
                  Bank Account & Personal Details (Optional)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontFamily: 'Inter', fontSize: '11px' }}>
                  Official bank account information for salary payments.
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="bankName"
                  label="Bank Name"
                  value={form.bankName}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="accountNumber"
                  label="Account Number"
                  value={form.accountNumber}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="ifscCode"
                  label="IFSC Code"
                  value={form.ifscCode}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="branchName"
                  label="Branch Name"
                  value={form.branchName}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#475569', mt: 2, mb: 0.5, fontFamily: 'Outfit' }}>
                  Salary Overview (Optional)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontFamily: 'Inter', fontSize: '11px' }}>
                  Official salary structures. Net Take Home is auto-calculated but can be manually overridden.
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="basicPay"
                  label="Basic Pay (₹)"
                  value={form.basicPay}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="hra"
                  label="HRA (₹)"
                  value={form.hra}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="specialAllowance"
                  label="Special Allowance (₹)"
                  value={form.specialAllowance}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="deductions"
                  label="Deductions (₹)"
                  value={form.deductions}
                  onChange={handleInputChange}
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="netTakeHome"
                  label="Net Take Home (₹)"
                  value={form.netTakeHome}
                  onChange={handleInputChange}
                  helperText="Admin override option"
                  InputProps={{ style: { fontSize: '13px', fontFamily: 'Inter', fontWeight: 'bold', color: '#10b981' } }}
                  InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
                  FormHelperTextProps={{ style: { fontSize: '10px', fontFamily: 'Inter' } }}
                />
              </Grid>
            </Grid>
            {!editMode && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                <Typography variant="body2" color="#475569" sx={{ fontWeight: 600, fontFamily: 'Inter', fontSize: '12px' }}>
                  🔑 Temporary Password: <span style={{ color: '#0284c7' }}>Welcome@123</span>
                </Typography>
                <Typography variant="caption" color="#64748b" display="block" sx={{ mt: 0.5, fontFamily: 'Inter', fontSize: '10.5px' }}>
                  The employee will use this password to sign in for the first time.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setOpen(false)} 
            variant="outlined"
            sx={{ 
              textTransform: 'none', 
              borderRadius: 2, 
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
            onClick={handleSubmit} 
            variant="contained" 
            sx={{ 
              textTransform: 'none', 
              borderRadius: 2,
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
            Save Employee
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Employee Password Dialog */}
      <Dialog open={resetPwOpen} onClose={() => setResetPwOpen(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3, p: 0.5 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '16px', pb: 0.5 }}>
          Reset Employee Password
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {resetPwEmp && (
            <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'Inter', mb: 2 }}>
              Set a new password for <strong>{resetPwEmp.firstName} {resetPwEmp.lastName}</strong> ({resetPwEmp.employeeCode}).
            </Typography>
          )}
          {resetPwError && <Alert severity="error" sx={{ mb: 2, py: 0.5, fontSize: '12px' }}>{resetPwError}</Alert>}
          {resetPwSuccess && <Alert severity="success" sx={{ mb: 2, py: 0.5, fontSize: '12px' }}>{resetPwSuccess}</Alert>}
          <TextField
            fullWidth
            size="small"
            label="New Password"
            type={showResetPw ? 'text' : 'password'}
            value={resetNewPw}
            onChange={(e) => setResetNewPw(e.target.value)}
            helperText="Minimum 6 characters"
            FormHelperTextProps={{ style: { fontSize: '10px', fontFamily: 'Inter' } }}
            InputProps={{
              style: { fontSize: '13px', fontFamily: 'Inter' },
              endAdornment: (
                <IconButton size="small" onClick={() => setShowResetPw(!showResetPw)} edge="end">
                  {showResetPw ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              )
            }}
            InputLabelProps={{ style: { fontSize: '12.5px', fontFamily: 'Inter' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setResetPwOpen(false)}
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none', borderRadius: 1.5, fontFamily: 'Outfit', fontWeight: 600, fontSize: '12px', borderColor: '#cbd5e1', color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmResetPw}
            variant="contained"
            size="small"
            disabled={resetPwLoading}
            sx={{
              textTransform: 'none', borderRadius: 1.5, fontFamily: 'Outfit', fontWeight: 700,
              fontSize: '12px', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              boxShadow: 'none', '&:hover': { background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)', boxShadow: 'none' }
            }}
          >
            {resetPwLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminEmployees;
