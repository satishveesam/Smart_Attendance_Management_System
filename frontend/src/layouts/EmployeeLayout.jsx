import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  Fingerprint as CheckInIcon,
  History as HistoryIcon,
  Face as ProfileIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  EventNote as LeaveIcon,
  RateReview as RateReviewIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Hail as AttendanceNavIcon,
} from '@mui/icons-material';

const EmployeeLayout = ({ children }) => {
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
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/employee/dashboard' },
    { text: 'Mark Attendance', icon: <CheckInIcon />, path: '/employee/attendance/mark' },
    { text: 'Attendance Logs', icon: <HistoryIcon />, path: '/employee/attendance' },
    { text: 'Leave & WFH', icon: <LeaveIcon />, path: '/employee/leaves' },
    { text: 'Face Registration', icon: <ProfileIcon />, path: '/employee/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/employee/settings' },
    ...(user?.role === 'ROLE_ADMIN' ? [
      { text: 'Approvals', icon: <RateReviewIcon />, path: '/employee/approvals' },
      { text: 'Admin Portal', icon: <AdminPanelSettingsIcon />, path: '/admin/dashboard' },
    ] : []),
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      
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
              bgcolor: 'rgba(16, 185, 129, 0.1)', 
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <CheckInIcon sx={{ color: '#10b981', fontSize: 18 }} />
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
              onClick={() => navigate('/employee/dashboard')}
            >
              SmartAttendance
            </Typography>
          </Box>

          {/* Center Navigation Links (Desktop/Tablet) */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.8 }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  sx={{
                    textTransform: 'none',
                    fontFamily: 'Outfit',
                    fontSize: '12px',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? '#10b981' : '#64748b',
                    bgcolor: isActive ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.7,
                    minWidth: 'auto',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                      color: isActive ? '#10b981' : '#1e293b',
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
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>
                {user?.username ? user.username[0].toUpperCase() : 'E'}
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
              <MenuItem disabled sx={{ fontSize: '12px', fontFamily: 'Outfit', fontWeight: 800, color: '#0f172a !important', opacity: '1 !important' }}>
                ID: {user?.employeeCode || 'N/A'}
              </MenuItem>
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
            location.pathname.startsWith('/employee/dashboard') ? 0 :
            location.pathname.startsWith('/employee/attendance') || location.pathname.startsWith('/employee/history') || location.pathname.startsWith('/employee/leaves') || location.pathname.startsWith('/employee/approvals') || location.pathname.startsWith('/employee/work-entry') ? 1 :
            location.pathname.startsWith('/employee/settings') || location.pathname.startsWith('/employee/profile') ? 2 : 0
          }
          onChange={(event, newValue) => {
            if (newValue === 0) navigate('/employee/dashboard');
            else if (newValue === 1) navigate('/employee/attendance');
            else if (newValue === 2) navigate('/employee/settings');
          }}
          sx={{
            height: '64px',
            '& .MuiBottomNavigationAction-root': {
              color: '#94a3b8',
              minWidth: 'auto',
              padding: '6px 0',
            },
            '& .Mui-selected': {
              color: '#10b981 !important',
              fontWeight: 'bold',
            }
          }}
        >
          <BottomNavigationAction label="Home" icon={<HomeIcon />} />
          <BottomNavigationAction label="Attendance" icon={<AttendanceNavIcon />} />
          <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default EmployeeLayout;
