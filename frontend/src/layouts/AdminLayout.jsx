import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Assessment as AssessmentIcon,
  Menu as MenuIcon,
  AccountCircle,
  Logout as LogoutIcon,
  EventNote as LeaveIcon,
  Fingerprint as CheckInIcon,
} from '@mui/icons-material';

const AdminLayout = ({ children }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Employees', icon: <PeopleIcon />, path: '/admin/employees' },
    { text: 'Attendance Logs', icon: <CalendarIcon />, path: '/admin/attendance' },
    { text: 'Leave Requests', icon: <LeaveIcon />, path: '/admin/leaves' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/admin/reports' },
    { text: 'Employee Portal', icon: <AccountCircle />, path: '/employee/dashboard' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', bgcolor: '#f8fafc', width: '100%', overflowX: 'hidden' }}>
      
      {/* Top Header Navbar */}
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          color: '#1e293b',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: '70px', display: 'flex', justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          
          {/* Logo & Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              p: 0.6, 
              borderRadius: 2, 
              bgcolor: 'rgba(56, 189, 248, 0.1)', 
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <CheckInIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
            </Box>
            <Typography 
              variant="h6" 
              noWrap 
              sx={{ 
                fontWeight: 'bold', 
                color: '#1e293b', 
                fontSize: '15px', 
                fontFamily: 'Outfit', 
                letterSpacing: '0.3px',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/admin/dashboard')}
            >
              SmartAttendance <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 'bold', marginLeft: '4px' }}>Admin</span>
            </Typography>
          </Box>

          {/* Center Navigation Links (Desktop/Tablet) */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isSpecial = item.path.startsWith('/employee');
              return (
                <Button
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  sx={{
                    textTransform: 'none',
                    fontFamily: 'Outfit',
                    fontSize: '12px',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? '#38bdf8' : isSpecial ? '#10b981' : '#64748b',
                    bgcolor: isActive ? 'rgba(56, 189, 248, 0.06)' : isSpecial ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.7,
                    minWidth: 'auto',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(56, 189, 248, 0.08)' : isSpecial ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                      color: isActive ? '#38bdf8' : isSpecial ? '#059669' : '#1e293b',
                    }
                  }}
                >
                  {item.text}
                </Button>
              );
            })}
          </Box>

          {/* User Account Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, color: '#64748b', fontSize: '12px', fontFamily: 'Inter' }}>
              Welcome, <strong>{user?.username}</strong>
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{ p: 0.5 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>
                {user?.username ? user.username[0].toUpperCase() : 'A'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{ sx: { borderRadius: 2.5, minWidth: 140, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mt: 1 } }}
            >
              <MenuItem disabled sx={{ fontSize: '11px', fontFamily: 'Inter' }}>{user?.email}</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ fontSize: '12px', color: '#e11d48', fontWeight: 'bold', fontFamily: 'Inter' }}>Sign Out</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          pb: { xs: 9, sm: 3 },
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
        }}
      >
        <Toolbar sx={{ minHeight: '70px' }} /> {/* Creates spacing below top AppBar */}
        <Box sx={{ flexGrow: 1, width: '100%' }}>{children}</Box>

        {/* Footer */}
        <Box sx={{ 
          py: 2.5, 
          px: 1, 
          borderTop: '1px solid #e2e8f0', 
          mt: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 1.5 
        }}>
          <Box sx={{
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Typography sx={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'Inter' }}>
              © {new Date().getFullYear()} SmartAttendance Inc. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography sx={{ fontSize: '11px', color: '#94a3b8', cursor: 'pointer', fontFamily: 'Inter', '&:hover': { color: '#64748b' } }}>Privacy Policy</Typography>
              <Typography sx={{ fontSize: '11px', color: '#94a3b8', cursor: 'pointer', fontFamily: 'Inter', '&:hover': { color: '#64748b' } }}>Terms of Service</Typography>
              <Typography sx={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'Inter' }}>v1.2.0</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Typography sx={{ 
              fontSize: '9px', 
              fontWeight: 800, 
              color: '#06b6d4', 
              fontFamily: 'Outfit', 
              letterSpacing: '1.5px', 
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 8px rgba(6, 182, 212, 0.15)'
            }}>
              DEVELOPED BY SATISHVEESAM
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Bottom Navigation for Mobile */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000, 
          display: { xs: 'block', sm: 'none' },
          borderTop: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.03)'
        }} 
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={
            location.pathname.startsWith('/admin/dashboard') ? 0 :
            location.pathname.startsWith('/admin/employees') ? 1 :
            location.pathname.startsWith('/admin/leaves') ? 2 :
            location.pathname.startsWith('/admin/attendance') || location.pathname.startsWith('/admin/reports') ? 3 : 0
          }
          onChange={(event, newValue) => {
            if (newValue === 0) navigate('/admin/dashboard');
            else if (newValue === 1) navigate('/admin/employees');
            else if (newValue === 2) navigate('/admin/leaves');
            else if (newValue === 3) navigate('/admin/attendance');
          }}
          sx={{
            height: '64px',
            '& .MuiBottomNavigationAction-root': {
              color: '#94a3b8',
              minWidth: 'auto',
              padding: '6px 0',
            },
            '& .Mui-selected': {
              color: '#38bdf8 !important',
              fontWeight: 'bold',
            }
          }}
        >
          <BottomNavigationAction label="Home" icon={<DashboardIcon />} />
          <BottomNavigationAction label="Employees" icon={<PeopleIcon />} />
          <BottomNavigationAction label="Leaves" icon={<LeaveIcon />} />
          <BottomNavigationAction label="Logs" icon={<CalendarIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default AdminLayout;
