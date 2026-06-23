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
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Drawer,
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
  Campaign as BroadcastIcon,
  ExpandLess,
  ExpandMore,
  Business as OfficeIcon,
} from '@mui/icons-material';

const sidebarWidth = 260;

const AdminLayout = ({ children }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(true);
  const [leavesOpen, setLeavesOpen] = useState(true);

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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Define sidebar list content
  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'Outfit' }}>
      {/* Brand Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box 
          sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            bgcolor: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          <OfficeIcon sx={{ color: '#2563eb', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '16px', lineHeight: 1.2, fontFamily: 'Outfit', letterSpacing: '0.5px' }}>
            ATS
          </Typography>
          <Typography sx={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'Inter' }}>
            Attendance Tracking System
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />

      {/* Nav List */}
      <Box sx={{ flexGrow: 1, px: 2, overflowY: 'auto' }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, p: 0 }}>
          
          {/* Dashboard */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => { navigate('/admin/dashboard'); setMobileOpen(false); }}
              sx={{
                borderRadius: 2.5,
                bgcolor: location.pathname === '/admin/dashboard' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: location.pathname === '/admin/dashboard' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                py: 1.2,
                px: 2
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>
                <DashboardIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard" 
                primaryTypographyProps={{ sx: { fontFamily: 'Outfit', fontSize: '13px', fontWeight: location.pathname === '/admin/dashboard' ? 600 : 500 } }} 
              />
            </ListItemButton>
          </ListItem>

          {/* Employees */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => { navigate('/admin/employees'); setMobileOpen(false); }}
              sx={{
                borderRadius: 2.5,
                bgcolor: location.pathname === '/admin/employees' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: location.pathname === '/admin/employees' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                py: 1.2,
                px: 2
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>
                <PeopleIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Employees" 
                primaryTypographyProps={{ sx: { fontFamily: 'Outfit', fontSize: '13px', fontWeight: location.pathname === '/admin/employees' ? 600 : 500 } }} 
              />
            </ListItemButton>
          </ListItem>

          {/* Attendance Folder */}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => setAttendanceOpen(!attendanceOpen)}
              sx={{
                borderRadius: 2.5,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                py: 1.2,
                px: 2
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>
                <CalendarIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Attendance List" 
                primaryTypographyProps={{ sx: { fontFamily: 'Outfit', fontSize: '13px', fontWeight: 500 } }} 
              />
              {attendanceOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
            </ListItemButton>
            
            <Collapse in={attendanceOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5, pl: 2.5 }}>
                <ListItemButton
                  onClick={() => { navigate('/admin/attendance'); setMobileOpen(false); }}
                  sx={{
                    borderRadius: 2,
                    py: 0.8,
                    px: 2,
                    bgcolor: location.pathname === '/admin/attendance' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    border: location.pathname === '/admin/attendance' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                  }}
                >
                  <ListItemText 
                    primary="Daily Attendance" 
                    primaryTypographyProps={{ sx: { fontFamily: 'Inter', fontSize: '12px', color: '#fff', fontWeight: location.pathname === '/admin/attendance' ? 600 : 400 } }} 
                  />
                </ListItemButton>
                <ListItemButton
                  onClick={() => { navigate('/admin/reports'); setMobileOpen(false); }}
                  sx={{
                    borderRadius: 2,
                    py: 0.8,
                    px: 2,
                    bgcolor: location.pathname === '/admin/reports' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    border: location.pathname === '/admin/reports' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                  }}
                >
                  <ListItemText 
                    primary="Monthly Attendance" 
                    primaryTypographyProps={{ sx: { fontFamily: 'Inter', fontSize: '12px', color: '#fff', fontWeight: location.pathname === '/admin/reports' ? 600 : 400 } }} 
                  />
                </ListItemButton>
              </List>
            </Collapse>
          </ListItem>

          {/* Leave Folder */}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => setLeavesOpen(!leavesOpen)}
              sx={{
                borderRadius: 2.5,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                py: 1.2,
                px: 2
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>
                <LeaveIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Leave" 
                primaryTypographyProps={{ sx: { fontFamily: 'Outfit', fontSize: '13px', fontWeight: 500 } }} 
              />
              {leavesOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
            </ListItemButton>
            
            <Collapse in={leavesOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5, pl: 2.5 }}>
                <ListItemButton
                  onClick={() => { navigate('/admin/leaves'); setMobileOpen(false); }}
                  sx={{
                    borderRadius: 2,
                    py: 0.8,
                    px: 2,
                    bgcolor: location.pathname === '/admin/leaves' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    border: location.pathname === '/admin/leaves' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                  }}
                >
                  <ListItemText 
                    primary="Leave Requests" 
                    primaryTypographyProps={{ sx: { fontFamily: 'Inter', fontSize: '12px', color: '#fff', fontWeight: location.pathname === '/admin/leaves' ? 600 : 400 } }} 
                  />
                </ListItemButton>
              </List>
            </Collapse>
          </ListItem>

          {/* Broadcasts */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => { navigate('/admin/broadcasts'); setMobileOpen(false); }}
              sx={{
                borderRadius: 2.5,
                bgcolor: location.pathname === '/admin/broadcasts' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: location.pathname === '/admin/broadcasts' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                py: 1.2,
                px: 2
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>
                <BroadcastIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Broadcasts" 
                primaryTypographyProps={{ sx: { fontFamily: 'Outfit', fontSize: '13px', fontWeight: location.pathname === '/admin/broadcasts' ? 600 : 500 } }} 
              />
            </ListItemButton>
          </ListItem>

          {/* Employee Portal */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => { navigate('/employee/dashboard'); setMobileOpen(false); }}
              sx={{
                borderRadius: 2.5,
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.25)' },
                py: 1.2,
                px: 2,
                mt: 1
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>
                <AccountCircle sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Employee Portal" 
                primaryTypographyProps={{ sx: { fontFamily: 'Outfit', fontSize: '13px', fontWeight: 600 } }} 
              />
            </ListItemButton>
          </ListItem>

        </List>
      </Box>

      {/* User Info footer in Sidebar */}
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255, 255, 255, 0.18)', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
          {user?.username ? user.username[0].toUpperCase() : 'A'}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography noWrap sx={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'Outfit' }}>
            {user?.employeeCode || user?.username}
          </Typography>
          <Typography noWrap sx={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter' }}>
            {user?.email || 'admin@smartattendance.com'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleLogout} sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: '#ef4444' } }}>
          <LogoutIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
      
      {/* Permanent Sidebar for Desktop (md & up) */}
      <Box
        component="nav"
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: sidebarWidth,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: 0,
            background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.05)',
            zIndex: 1100,
          }}
        >
          {sidebarContent}
        </Paper>
      </Box>

      {/* Temporary Mobile Drawer (sm & down) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Main Body Container */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        {/* Mobile Header Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            display: { xs: 'block', md: 'none' },
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            color: '#1e293b',
            zIndex: 1000,
          }}
        >
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 'bold', fontSize: '15px' }}>
              SmartAttendance <span style={{ color: '#2563eb', fontSize: '12px' }}>Admin</span>
            </Typography>

            <IconButton size="small" onClick={handleMenu}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#2563eb', fontSize: '12px', fontWeight: 'bold' }}>
                {user?.username ? user.username[0].toUpperCase() : 'A'}
              </Avatar>
            </IconButton>

            <Menu
              id="mobile-user-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{ sx: { borderRadius: 2.5, minWidth: 140, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } }}
            >
              <MenuItem disabled sx={{ fontSize: '11px', fontFamily: 'Inter' }}>{user?.email}</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ fontSize: '12px', color: '#e11d48', fontWeight: 'bold', fontFamily: 'Inter' }}>Sign Out</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Content Children */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            pb: { xs: 9, sm: 3 }, // padding for mobile bottom bar
            width: '100%',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile Bottom Navigation Bar */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000, 
          display: { xs: 'block', md: 'none' },
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
              color: '#2563eb !important',
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
