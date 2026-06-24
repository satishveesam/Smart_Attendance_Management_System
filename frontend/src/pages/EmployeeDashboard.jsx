import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import EmployeeLayout from '../layouts/EmployeeLayout';
import API from '../api';
import {
  Typography,
  Box,
  Button,
  Avatar,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CalendarMonth as AttendanceIcon,
  MonetizationOn as SalaryIcon,
  ReceiptLong as SlipsIcon,
  AccountBalanceWallet as LoanIcon,
  Campaign as BroadcastIcon,
  Schedule as RosterIcon,
  RateReview as ApprovalsIcon,
  Umbrella as LeaveIcon,
  AssignmentTurnedIn as TasksIcon,
  Fingerprint as CheckInIcon,
  History as HistoryIcon,
  Face as ProfileIcon,
  AccessTime as TimeIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

const EmployeeDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard statistics states
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [todayLog, setTodayLog] = useState(null);

  // Dialog states
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogContent, setDialogContent] = useState('');

  // Daily work log states
  const [workEntryOpen, setWorkEntryOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [hoursSpent, setHoursSpent] = useState(8);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState('');
  const [taskError, setTaskError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchDashboardStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/employees/me');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const [attRes, leaveRes] = await Promise.all([
        API.get('/attendance/history'),
        API.get('/leaves/my')
      ]);
      
      setAttendanceHistory(attRes.data);
      setLeaveHistory(leaveRes.data);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = attRes.data.find((r) => r.attendanceDate === todayStr);
      setTodayLog(todayRecord || null);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (title, path, action) => {
    if (action === 'work-entry') {
      setWorkEntryOpen(true);
    } else if (path) {
      navigate(path);
    } else {
      setDialogTitle(title);
      if (title === 'Salary Overview') {
        setDialogContent('Current Month Salary: ₹55,000\nBasic Pay: ₹35,000\nHRA: ₹15,000\nSpecial Allowance: ₹5,000\nDeductions (PF/Tax): ₹4,200\nNet Take Home: ₹50,800');
      } else if (title === 'Salary Slips') {
        setDialogContent('Available Payslips:\n• May 2026 - Paid (Download PDF)\n• Apr 2026 - Paid (Download PDF)\n• Mar 2026 - Paid (Download PDF)');
      } else if (title === 'Loan Request') {
        setDialogContent('No active loans found.\nMaximum eligible advance loan amount: ₹50,000.\nClick Apply to request an advance salary loan.');
      } else if (title === 'Broadcast Board') {
        setDialogContent('📢 Notice: Biometric facial check-in is mandatory for all office working days.\n📢 Update: System upgrading scheduled on Sunday 2:00 AM.');
      } else if (title === 'Roster Schedule') {
        setDialogContent('Shift Schedule:\nGeneral Shift (10:00 AM - 06:30 PM)\nWeekly Offs: Saturday, Sunday');
      }
      setInfoDialogOpen(true);
    }
  };

  const handleTaskSubmit = async () => {
    setTaskError('');
    setTaskSuccess('');
    if (!taskDescription.trim()) {
      setTaskError('Task description cannot be empty');
      return;
    }

    setSubmittingTask(true);
    try {
      await API.post('/work-entries/submit', {
        entryDate: new Date().toISOString().split('T')[0],
        taskDescription: taskDescription,
        hoursSpent: Number(hoursSpent)
      });
      setTaskSuccess('Daily work entry submitted successfully!');
      setTaskDescription('');
      setTimeout(() => {
        setWorkEntryOpen(false);
        setTaskSuccess('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setTaskError('Failed to submit work entry');
    } finally {
      setSubmittingTask(false);
    }
  };

  // Compute stats metrics
  const presentDays = attendanceHistory.filter(r => r.checkIn).length;
  const lateDays = attendanceHistory.filter(r => r.status === 'LATE').length;
  const approvedLeaves = leaveHistory.filter(l => l.status === 'APPROVED').length;
  const pendingLeaves = leaveHistory.filter(l => l.status === 'PENDING').length;

  // Actions menu
  const primaryActions = [
    { title: 'Mark Attendance', icon: <CheckInIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#10b981' }} />, path: '/employee/attendance/mark', bg: '#f0fdf4' },
    { title: 'Attendance Logs', icon: <HistoryIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#3b82f6' }} />, path: '/employee/attendance', bg: '#eff6ff' },
    { title: 'Apply Leaves', icon: <LeaveIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#f59e0b' }} />, path: '/employee/leaves', bg: '#fffbeb' },
    { title: 'Daily Work Entry', icon: <TasksIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#4f46e5' }} />, action: 'work-entry', bg: '#e0e7ff' },
    { title: 'Face Registration', icon: <ProfileIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#ec4899' }} />, path: '/employee/profile', bg: '#fdf2f8' },
    { title: 'Roster Schedule', icon: <RosterIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#8b5cf6' }} />, bg: '#f5f3ff' },
    { title: 'Salary Overview', icon: <SalaryIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#10b981' }} />, bg: '#ecfdf5' },
    { title: 'Salary Slips', icon: <SlipsIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#06b6d4' }} />, bg: '#ecfeff' },
    { title: 'Loan Request', icon: <LoanIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#d97706' }} />, bg: '#fffbeb' },
    { title: 'Broadcast Board', icon: <BroadcastIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#64748b' }} />, bg: '#f8fafc' },
    ...(user?.role === 'ROLE_ADMIN' ? [
      { title: 'My Approvals', icon: <ApprovalsIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: '#ef4444' }} />, path: '/employee/approvals', bg: '#fef2f2' }
    ] : []),
  ];

  return (
    <EmployeeLayout>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={32} sx={{ color: '#10b981' }} />
        </Box>
      ) : (
        <Box className="fade-in" sx={{ pb: { xs: 3, md: 5 } }}>
          
          {/* 1. Sleek Outside Header Banner */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 3.5, mt: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 44, md: 52 },
                height: { xs: 44, md: 52 },
                borderRadius: 3,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}>
                <DashboardIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.4rem', md: '1.85rem' }, fontFamily: 'Outfit', letterSpacing: '-0.5px' }}>
                  Hello, {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Employee'} 👋
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '12px', md: '13px' }, mt: 0.2, fontFamily: 'Inter' }}>
                  {profile?.designation || 'Software Engineer'} • {profile?.department || 'Engineering'} • Code: <strong>{profile?.employeeCode || '...'}</strong>
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="contained"
                onClick={() => navigate('/employee/attendance/mark')}
                startIcon={<CheckInIcon sx={{ fontSize: 16 }} />}
                sx={{
                  flexGrow: { xs: 1, sm: 0 },
                  textTransform: 'none',
                  fontFamily: 'Outfit',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  bgcolor: '#10b981',
                  boxShadow: 'none',
                  px: 2.5,
                  py: 1,
                  '&:hover': { bgcolor: '#059669', boxShadow: 'none' }
                }}
              >
                Mark Attendance
              </Button>
            </Box>
          </Box>

          {/* 2. Consolidated Statistics Row Card */}
          <Card 
            sx={{ 
              borderRadius: 4, 
              border: '1px solid #f1f5f9', 
              mb: 4, 
              bgcolor: '#fff', 
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2.5, sm: 0 }, justifyContent: 'space-around', alignItems: 'center' }}>
              
              {/* Stat 1: Attendance */}
              <Box sx={{ textAlign: 'center', flex: 1, width: '100%' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, display: 'block', fontSize: '9px', letterSpacing: '0.8px', mb: 0.8, fontFamily: 'Inter', textTransform: 'uppercase' }}>
                  Attendance Summary
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '20px', color: '#10b981', fontFamily: 'Outfit' }}>
                  {presentDays} Days
                </Typography>
                <Typography sx={{ color: '#ef4444', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter', mt: 0.3 }}>
                  {lateDays} late arrivals logged
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, mx: 2, borderColor: '#f1f5f9' }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '100%', borderColor: '#f1f5f9' }} />

              {/* Stat 2: Leaves */}
              <Box sx={{ textAlign: 'center', flex: 1, width: '100%' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, display: 'block', fontSize: '9px', letterSpacing: '0.8px', mb: 0.8, fontFamily: 'Inter', textTransform: 'uppercase' }}>
                  Leaves & WFH
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '20px', color: '#f59e0b', fontFamily: 'Outfit' }}>
                  {approvedLeaves} Approved
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter', mt: 0.3 }}>
                  {pendingLeaves} pending approvals
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, mx: 2, borderColor: '#f1f5f9' }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '100%', borderColor: '#f1f5f9' }} />

              {/* Stat 3: Today's Shift Status */}
              <Box sx={{ textAlign: 'center', flex: 1, width: '100%' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, display: 'block', fontSize: '9px', letterSpacing: '0.8px', mb: 0.8, fontFamily: 'Inter', textTransform: 'uppercase' }}>
                  Today's Shift Status
                </Typography>
                <Chip
                  label={todayLog ? todayLog.status : 'NOT CHECKED IN'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '9px',
                    fontWeight: 800,
                    borderRadius: '6px',
                    fontFamily: 'Outfit',
                    bgcolor: todayLog?.status === 'PRESENT' ? '#ecfdf5' : todayLog?.status === 'LATE' ? '#fffbeb' : '#f8fafc',
                    color: todayLog?.status === 'PRESENT' ? '#10b981' : todayLog?.status === 'LATE' ? '#d97706' : '#64748b',
                    border: `1px solid ${todayLog?.status === 'PRESENT' ? '#a7f3d0' : todayLog?.status === 'LATE' ? '#fde68a' : '#e2e8f0'}`,
                    mb: 0.5
                  }}
                />
                <Typography sx={{ color: '#64748b', fontSize: '10px', display: 'block', fontFamily: 'Inter', fontWeight: 500 }}>
                  {todayLog?.checkIn
                    ? `Check In: ${new Date(todayLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Shift: 10:00 AM - 06:30 PM'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* 3. Core Action Grid */}
          <Box sx={{ mb: 4.5 }}>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 2, fontFamily: 'Outfit', fontSize: '14.5px', letterSpacing: '-0.2px' }}>
              Core Services & Quick Links
            </Typography>
            
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)',
                md: 'repeat(5, 1fr)',
              },
              gap: 2,
              width: '100%',
            }}>
              {primaryActions.map((action) => (
                <Paper
                  key={action.title}
                  onClick={() => handleCardClick(action.title, action.path, action.action)}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3.5,
                    cursor: 'pointer',
                    bgcolor: '#fff',
                    textAlign: 'center',
                    height: 105,
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: '#cbd5e1',
                      boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.04)',
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2.5, 
                    bgcolor: action.bg, 
                    mb: 1.5, 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {action.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: '#334155', fontFamily: 'Outfit', fontSize: '11.5px', lineHeight: 1.2 }}>
                    {action.title}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>

          {/* 4. Recent Logs / Activity Feed */}
          {attendanceHistory.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 2, fontFamily: 'Outfit', fontSize: '14.5px', letterSpacing: '-0.2px' }}>
                Recent Attendance Activities
              </Typography>
              <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)', overflow: 'hidden' }}>
                <CardContent sx={{ p: 1 }}>
                  <List sx={{ py: 0 }}>
                    {attendanceHistory.slice(0, 3).map((log, index) => (
                      <React.Fragment key={log.id || index}>
                        {index > 0 && <Divider sx={{ borderColor: '#f8fafc' }} />}
                        <ListItem sx={{ py: 1.5, px: 2.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <TimeIcon sx={{ color: log.status === 'LATE' ? '#d97706' : '#10b981', fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a', fontFamily: 'Outfit' }}>
                                {new Date(log.attendanceDate).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10px', fontFamily: 'Inter', mt: 0.2, display: 'block' }}>
                                Checked In: <strong>{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</strong>
                                {log.checkOut ? ` | Checked Out: ${new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                              </Typography>
                            }
                          />
                          <Chip
                            label={log.status}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '8.5px',
                              fontWeight: 800,
                              fontFamily: 'Outfit',
                              bgcolor: log.status === 'PRESENT' ? '#ecfdf5' : log.status === 'LATE' ? '#fffbeb' : '#fef2f2',
                              color: log.status === 'PRESENT' ? '#10b981' : log.status === 'LATE' ? '#d97706' : '#dc2626',
                              border: `1px solid ${log.status === 'PRESENT' ? '#a7f3d0' : log.status === 'LATE' ? '#fde68a' : '#fca5a5'}`
                            }}
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}

        </Box>
      )}

      {/* Info Dialog for Mock Actions */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '16px', fontFamily: 'Outfit', color: '#0f172a' }}>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-line', color: '#475569', fontSize: '13px', fontFamily: 'Inter', lineHeight: 1.6 }}>
            {dialogContent}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setInfoDialogOpen(false)} 
            variant="contained" 
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              bgcolor: '#1e293b', 
              fontSize: '11.5px', 
              fontWeight: 'bold',
              fontFamily: 'Outfit',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#0f172a', boxShadow: 'none' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Work Entry Dialog */}
      <Dialog open={workEntryOpen} onClose={() => setWorkEntryOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '16.5px', fontFamily: 'Outfit', color: '#0f172a' }}>Submit Daily Work Log</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {taskSuccess && <Alert severity="success" sx={{ mb: 2, py: 0.5, fontSize: '11.5px', borderRadius: 2.5 }}>{taskSuccess}</Alert>}
          {taskError && <Alert severity="error" sx={{ mb: 2, py: 0.5, fontSize: '11.5px', borderRadius: 2.5 }}>{taskError}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <TextField
              label="Tasks Completed Today"
              placeholder="e.g. Fixed bugs in auth services, compiled UI/UX layout views for responsive mobile viewports."
              multiline
              rows={4}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              fullWidth
              inputProps={{ style: { fontSize: 12.5, fontFamily: 'Inter' } }}
              InputLabelProps={{ style: { fontSize: 12.5, fontFamily: 'Inter' } }}
            />
            <TextField
              label="Hours Spent"
              type="number"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(e.target.value)}
              fullWidth
              inputProps={{ style: { fontSize: 12.5, fontFamily: 'Inter' } }}
              InputLabelProps={{ style: { fontSize: 12.5, fontFamily: 'Inter' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setWorkEntryOpen(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontSize: '12px', fontWeight: 'bold', fontFamily: 'Outfit' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleTaskSubmit} 
            variant="contained" 
            disabled={submittingTask}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              bgcolor: '#10b981', 
              fontFamily: 'Outfit',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#059669', boxShadow: 'none' }
            }}
          >
            {submittingTask ? <CircularProgress size={16} color="inherit" /> : 'Submit Log'}
          </Button>
        </DialogActions>
      </Dialog>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
