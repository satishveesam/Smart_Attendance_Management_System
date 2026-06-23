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
      joiningDate: new Date().toISOString().split('T')[0],
      username: '',
      role: 'ROLE_EMPLOYEE',
      customLatitude: '',
      customLongitude: '',
      customRadiusMeters: '',
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

  return (
    <AdminLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: { xs: '22px', sm: '28px' } }}>
            Employees Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '13px' }}>
            Add, update, and manage employee profiles, geofences, and access privileges.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={handleOpenCreate}
          fullWidth
          sx={{
            width: { sm: 'auto' },
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            textTransform: 'none',
            borderRadius: 2.5,
            px: 3,
            py: 1.1,
            fontFamily: 'Outfit',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 12px 0 rgba(2, 132, 199, 0.25)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
              boxShadow: '0 6px 16px 0 rgba(2, 132, 199, 0.35)',
            },
          }}
        >
          Add Employee
        </Button>
      </Box>

      {/* Search Bar */}
      <Paper
        component="form"
        onSubmit={handleSearchSubmit}
        sx={{ 
          p: '4px 8px', 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4, 
          borderRadius: 3, 
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.02)', 
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
            style: { fontSize: '13px', fontFamily: 'Inter' }
          }}
          sx={{ 
            '& fieldset': { border: 'none' } 
          }}
        />
        <IconButton type="submit" sx={{ p: '10px', color: '#64748b' }} aria-label="search">
          <SearchIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Paper>

      {/* Employees Container */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : employees.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', color: '#64748b', borderRadius: 3.5, border: '1px solid #f1f5f9' }}>
          <Typography variant="body1" sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px' }}>
            No employee profiles found. Add a new employee to get started.
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
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Designation</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#0284c7', fontFamily: 'Inter', fontSize: '13px' }}>{emp.employeeCode}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: '13.5px' }}>{`${emp.firstName} ${emp.lastName}`}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{emp.email}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{emp.department || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{emp.designation || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{emp.phone || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(emp)} sx={{ mr: 0.5, bgcolor: '#f0f9ff', '&:hover': { bgcolor: '#e0f2fe' } }}>
                        <EditIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(emp.id)} sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                        <DeleteIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Cards List View (xs only) */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 2.5 }}>
            {employees.map((emp) => (
              <Card 
                key={emp.id} 
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
                    {emp.employeeCode}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(emp)} sx={{ bgcolor: '#f0f9ff', p: 0.6 }}>
                      <EditIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(emp.id)} sx={{ bgcolor: '#fef2f2', p: 0.6 }}>
                      <DeleteIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography sx={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', fontFamily: 'Outfit' }}>
                  {`${emp.firstName} ${emp.lastName}`}
                </Typography>
                
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: '12px', fontFamily: 'Inter' }}>
                  ✉️ {emp.email}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '10px' }}>Department</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', fontFamily: 'Outfit' }}>{emp.department || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '10px' }}>Designation</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', fontFamily: 'Outfit' }}>{emp.designation || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '10px' }}>Phone</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '11.5px', color: '#334155', fontFamily: 'Outfit' }}>{emp.phone || '-'}</Typography>
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
    </AdminLayout>
  );
};

export default AdminEmployees;
