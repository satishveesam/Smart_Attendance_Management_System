import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import EmployeeLayout from '../layouts/EmployeeLayout';
import API from '../api';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Paper,
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
  CheckCircle as SuccessIcon,
  History as HistoryIcon,
  Face as ProfileIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

const EmployeeDashboard = () => {
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  // Late entry dialog state
  const [lateEntriesOpen, setLateEntriesOpen] = useState(false);

  // Extra shifts dialog state
  const [extraShiftsOpen, setExtraShiftsOpen] = useState(false);

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

      const todayStr = getLocalDateString();
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
    } else if (action === 'late-entries') {
      setLateEntriesOpen(true);
    } else if (action === 'extra-shifts') {
      setExtraShiftsOpen(true);
    } else if (path) {
      navigate(path);
    } else {
      setDialogTitle(title);
      if (title === 'Salary Overview') {
        setDialogContent('Current Month Salary: ₹55,000\nBasic Pay: ₹35,000\nHRA: ₹15,000\nSpecial Allowance: ₹5,000\nDeductions (PF/Tax): ₹4,200\nNet Take Home: ₹50,800');
      } else if (title === 'Salary Slips') {
        setDialogContent('Available Payslips:\n• May 2026 - Paid (Download PDF)\n• Apr 2026 - Paid (Download PDF)\n• Mar 2026 - Paid (Download PDF)');
      } else if (title === 'Loan') {
        setDialogContent('No active loans found.\nMaximum eligible advance loan amount: ₹50,000.\nClick Apply to request an advance salary loan.');
      } else if (title === 'Broadcast Messages') {
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
        entryDate: getLocalDateString(),
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
    { title: 'Mark Attendance', icon: <CheckInIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#10b981' }} />, path: '/employee/attendance/mark', bg: '#f0fdf4' },
    { title: 'Attendance Logs', icon: <HistoryIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#3b82f6' }} />, path: '/employee/attendance', bg: '#eff6ff' },
    { title: 'Apply Leaves', icon: <LeaveIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#f59e0b' }} />, path: '/employee/leaves', bg: '#fffbeb' },
    { title: 'Daily Work Entry', icon: <TasksIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#4f46e5' }} />, action: 'work-entry', bg: '#e0e7ff' },
    { title: 'Face Registration', icon: <ProfileIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#ec4899' }} />, path: '/employee/profile', bg: '#fdf2f8' },
    { title: 'Late Entries', icon: <TimeIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#ef4444' }} />, action: 'late-entries', bg: '#fef2f2' },
    { title: 'Extra Shifts', icon: <TimeIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#8b5cf6' }} />, action: 'extra-shifts', bg: '#f3e8ff' },
    { title: 'Roster Schedule', icon: <RosterIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#8b5cf6' }} />, bg: '#f5f3ff' },
    { title: 'Salary Overview', icon: <SalaryIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#10b981' }} />, bg: '#ecfdf5' },
    { title: 'Salary Slips', icon: <SlipsIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#06b6d4' }} />, bg: '#ecfeff' },
    { title: 'Loan Request', icon: <LoanIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#d97706' }} />, bg: '#fffbeb' },
    { title: 'Broadcast Board', icon: <BroadcastIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#64748b' }} />, bg: '#f8fafc' },
    ...(user?.role === 'ROLE_ADMIN' ? [
      { title: 'My Approvals', icon: <ApprovalsIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#ef4444' }} />, path: '/employee/approvals', bg: '#fef2f2' }
    ] : []),
  ];

  return (
    <EmployeeLayout>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box className="fade-in" sx={{ pb: { xs: 2, md: 4 } }}>
          
          {/* 1. Header Welcome Row (Simple, clean, no background card) */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, mt: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>
                {profile?.firstName?.[0]?.toUpperCase() || 'E'}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: '15px', lineHeight: 1.2 }}>
                  Hello, {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Employee'} 👋
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '10.5px', fontFamily: 'Inter' }}>
                  {profile?.designation && profile.designation !== 'e' ? profile.designation : 'Software Engineer'} • {profile?.department && profile.department !== 'e' ? profile.department : 'Engineering'} (ID: {profile?.employeeCode || 'e101'})
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* 2. Consolidated Statistics Row Card */}
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2.5, bgcolor: '#fff', boxShadow: 'none' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              {/* Stat 1: Attendance */}
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold', display: 'block', fontSize: '9px', letterSpacing: '0.5px', mb: 0.5 }}>
                  ATTENDANCE
                </Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#10b981', fontFamily: 'Outfit' }}>
                  {presentDays} Days
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '8px', display: 'block' }}>
                  Total Present
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              {/* Stat 2: Late Entries (Dedicated Block!) */}
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold', display: 'block', fontSize: '9px', letterSpacing: '0.5px', mb: 0.5 }}>
                  LATE ENTRIES
                </Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#f59e0b', fontFamily: 'Outfit' }}>
                  {lateDays} Days
                </Typography>
                <Typography sx={{ color: '#ef4444', fontSize: '8px', display: 'block', fontWeight: 'bold' }}>
                  Late check-ins
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              {/* Stat 3: Leaves */}
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold', display: 'block', fontSize: '9px', letterSpacing: '0.5px', mb: 0.5 }}>
                  LEAVES & WFH
                </Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#f59e0b', fontFamily: 'Outfit' }}>
                  {approvedLeaves} Approved
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '8px', display: 'block' }}>
                  {pendingLeaves} pending
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              {/* Stat 4: Today's Status */}
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold', display: 'block', fontSize: '9px', letterSpacing: '0.5px', mb: 0.5 }}>
                  TODAY'S SHIFT
                </Typography>
                <Chip
                  label={todayLog ? todayLog.status : 'PENDING'}
                  size="small"
                  color={
                    todayLog?.status === 'PRESENT'
                      ? 'success'
                      : todayLog?.status === 'LATE'
                      ? 'warning'
                      : todayLog?.status === 'HALF_DAY'
                      ? 'warning'
                      : 'default'
                  }
                  sx={{
                    height: 16,
                    fontSize: '8px',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    '& .MuiChip-label': { px: 0.8 },
                  }}
                />
                <Typography sx={{ color: '#64748b', fontSize: '8px', display: 'block', mt: 0.3 }}>
                  {todayLog?.checkIn
                    ? `In: ${new Date(todayLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : '10:00 AM Shift'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* 3. Core Action Grid */}
          <Typography sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1, fontFamily: 'Outfit', fontSize: { xs: '12px', sm: '14px' } }}>
            Core Actions & Services
          </Typography>
          
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(4, 1fr)',
              sm: 'repeat(5, 1fr)',
              md: 'repeat(6, 1fr)',
            },
            gap: 1,
            mb: 2.5,
            width: '100%',
          }}>
            {primaryActions.map((action) => (
              <Paper
                key={action.title}
                onClick={() => handleCardClick(action.title, action.path, action.action)}
                sx={{
                  p: { xs: 0.8, sm: 1 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: '#fff',
                  textAlign: 'center',
                  height: { xs: 70, sm: 95 },
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ 
                  p: { xs: 0.5, sm: 0.8 }, 
                  borderRadius: 1.5, 
                  bgcolor: action.bg, 
                  mb: { xs: 0.5, sm: 0.8 }, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {action.icon}
                </Box>
                <Typography sx={{ fontWeight: '700', color: '#334155', fontFamily: 'Outfit', fontSize: { xs: '8px', sm: '11px' }, lineHeight: 1.1 }}>
                  {action.title}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* 4. Recent Logs (Full Width & Premium Layout) */}
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1.5, fontFamily: 'Outfit', fontSize: { xs: '13px', sm: '15px' }, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon sx={{ color: '#3b82f6', fontSize: 18 }} /> Recent Attendance Activities
            </Typography>
            
            {attendanceHistory.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', color: '#64748b', borderRadius: 3, border: '1px dashed #e2e8f0' }}>
                No recent activities recorded.
              </Paper>
            ) : (
              <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none', bgcolor: '#fff' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <List sx={{ py: 0 }}>
                    {attendanceHistory.slice(0, 4).map((log, index) => (
                      <React.Fragment key={log.id || index}>
                        {index > 0 && <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />}
                        <ListItem sx={{ py: 0.8, px: { xs: 1, sm: 1.5 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                          
                          {/* Check-In Selfie Thumbnail */}
                          <Box sx={{ position: 'relative' }}>
                            {log.checkInSelfie ? (
                              <Avatar
                                src={log.checkInSelfie}
                                variant="rounded"
                                sx={{ width: 42, height: 42, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}
                              />
                            ) : (
                              <Avatar variant="rounded" sx={{ width: 42, height: 42, bgcolor: '#f1f5f9', color: '#94a3b8' }}>
                                <ProfileIcon sx={{ fontSize: 18 }} />
                              </Avatar>
                            )}
                            {/* Status dot */}
                            <Box sx={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              border: '2px solid #fff',
                              bgcolor: log.status === 'PRESENT' ? '#10b981' : log.status === 'LATE' ? '#f59e0b' : '#ef4444',
                            }} />
                          </Box>

                          <ListItemText
                            primary={
                              <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '12px', sm: '13px' }, color: '#1e293b', fontFamily: 'Outfit' }}>
                                {new Date(log.attendanceDate).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10px', fontFamily: 'Inter', mt: 0.2, display: 'block' }}>
                                📥 In: <strong>{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</strong>
                                {log.checkOut ? `  |  📤 Out: ` : ''}
                                {log.checkOut ? <strong>{new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> : ''}
                              </Typography>
                            }
                          />
                          
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip
                              label={log.status}
                              size="small"
                              color={log.status === 'PRESENT' ? 'success' : log.status === 'LATE' ? 'warning' : log.status === 'HALF_DAY' ? 'primary' : 'error'}
                              sx={{ height: 18, fontSize: '8.5px', fontWeight: 'bold', fontFamily: 'Outfit', borderRadius: '5px' }}
                            />
                            {log.totalHours && (
                              <Typography sx={{ display: 'block', fontSize: '9px', color: '#94a3b8', mt: 0.4, fontFamily: 'Inter' }}>
                                ⏱️ {log.totalHours.toFixed(1)} hrs
                              </Typography>
                            )}
                          </Box>

                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>

        </Box>
      )}

      {/* Info Dialog for Mock Actions */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: { xs: '15px', sm: '17px' }, fontFamily: 'Outfit' }}>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-line', color: '#475569', fontSize: { xs: '11.5px', sm: '13px' }, fontFamily: 'Inter' }}>
            {dialogContent}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInfoDialogOpen(false)} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Work Entry Dialog */}
      <Dialog open={workEntryOpen} onClose={() => setWorkEntryOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: { xs: '15px', sm: '17px' }, fontFamily: 'Outfit' }}>Daily Work Entry</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {taskSuccess && <Alert severity="success" sx={{ mb: 2, py: 0.5, fontSize: '11.5px' }}>{taskSuccess}</Alert>}
          {taskError && <Alert severity="error" sx={{ mb: 2, py: 0.5, fontSize: '11.5px' }}>{taskError}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Tasks Completed Today"
              placeholder="e.g. Fixed bugs in auth services, compiled UI/UX layout views for responsive mobile viewports."
              multiline
              rows={4}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              fullWidth
              inputProps={{ style: { fontSize: 12, fontFamily: 'Inter' } }}
              InputLabelProps={{ style: { fontSize: 12, fontFamily: 'Inter' } }}
            />
            <TextField
              label="Hours Spent"
              type="number"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(e.target.value)}
              fullWidth
              inputProps={{ style: { fontSize: 12, fontFamily: 'Inter' } }}
              InputLabelProps={{ style: { fontSize: 12, fontFamily: 'Inter' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setWorkEntryOpen(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontSize: '11.5px', fontWeight: 'bold' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleTaskSubmit} 
            variant="contained" 
            color="primary"
            disabled={submittingTask}
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '11.5px', fontWeight: 'bold', bgcolor: '#2563eb' }}
          >
            {submittingTask ? <CircularProgress size={16} color="inherit" /> : 'Submit Log'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Late Entries Audit Dialog */}
      <Dialog 
        open={lateEntriesOpen} 
        onClose={() => setLateEntriesOpen(false)} 
        fullWidth 
        maxWidth="xs" 
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: { xs: '15px', sm: '17px' }, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <TimeIcon sx={{ color: '#ef4444', fontSize: 22 }} /> My Late Entries
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter', mb: 2, lineHeight: 1.4 }}>
            Corporate check-ins after <strong>09:15 AM</strong> are flagged as late. Consistent punctuality keeps your streak green!
          </Typography>

          {attendanceHistory.filter(r => r.status === 'LATE').length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center', bgcolor: '#f0fdf4', borderRadius: 3, border: '1px solid #bbf7d0', p: 2 }}>
              <Typography sx={{ fontWeight: 'bold', color: '#166534', fontSize: '13px', fontFamily: 'Outfit' }}>
                🌟 Perfect Punctuality!
              </Typography>
              <Typography sx={{ color: '#166534', fontSize: '10.5px', mt: 0.5, fontFamily: 'Inter' }}>
                You have no late entries recorded. Keep it up!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
              {attendanceHistory.filter(r => r.status === 'LATE').map((log, i) => {
                const checkInTime = log.checkIn ? new Date(log.checkIn) : null;
                const minutesLate = checkInTime ? Math.max(0, (checkInTime.getHours() * 60 + checkInTime.getMinutes()) - (9 * 60 + 15)) : 0;
                
                return (
                  <Box 
                    key={i} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      p: 1.2, 
                      bgcolor: '#fff', 
                      borderRadius: 3, 
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {log.checkInSelfie ? (
                        <Avatar
                          src={log.checkInSelfie}
                          variant="rounded"
                          sx={{ width: 36, height: 36, borderRadius: 2, border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                        <Avatar variant="rounded" sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#f1f5f9', color: '#94a3b8' }}>
                          <ProfileIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      )}
                      <Box>
                        <Typography sx={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit' }}>
                          {new Date(log.attendanceDate).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                        <Typography sx={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'Inter', mt: 0.1 }}>
                          In: {checkInTime ? checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`+${minutesLate}m late`}
                      size="small"
                      sx={{ height: 18, fontSize: '9px', fontWeight: 800, bgcolor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button 
            onClick={() => setLateEntriesOpen(false)} 
            variant="contained" 
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              bgcolor: '#1e293b', 
              fontSize: '11px', 
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#0f172a' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Extra Shifts Dialog */}
      <Dialog 
        open={extraShiftsOpen} 
        onClose={() => setExtraShiftsOpen(false)} 
        fullWidth 
        maxWidth="xs" 
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: { xs: '15px', sm: '17px' }, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <TimeIcon sx={{ color: '#8b5cf6', fontSize: 22 }} /> Extra Shifts & Overtime
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter', mb: 2, lineHeight: 1.4 }}>
            Work durations exceeding the standard <strong>8.5 hours</strong> are calculated as extra hours to reward your dedication!
          </Typography>

          {attendanceHistory.filter(r => r.totalHours && r.totalHours > 8.5).length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center', bgcolor: '#fbfbfe', borderRadius: 3, border: '1px dashed #e2e8f0', p: 2 }}>
              <Typography sx={{ fontWeight: 'bold', color: '#64748b', fontSize: '13px', fontFamily: 'Outfit' }}>
                No Extra Shifts Yet
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '10.5px', mt: 0.5, fontFamily: 'Inter' }}>
                Extra hours will accumulate automatically once your checked shift exceeds 8.5 hours.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Summary Card */}
              <Card sx={{ bgcolor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 3, p: 2, mb: 1, boxShadow: 'none' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sx={{ borderRight: '1px solid #ddd6fe', textAlign: 'center' }}>
                    <Typography sx={{ color: '#7c3aed', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
                      Extra Shifts
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#5b21b6', fontFamily: 'Outfit' }}>
                      {attendanceHistory.filter(r => r.totalHours && r.totalHours > 8.5).length} Days
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#7c3aed', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
                      Extra Hours
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#5b21b6', fontFamily: 'Outfit' }}>
                      {attendanceHistory.filter(r => r.totalHours && r.totalHours > 8.5)
                        .reduce((sum, r) => sum + (r.totalHours - 8.5), 0)
                        .toFixed(2)} hrs
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              {/* Logs list */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, maxHeight: 200, overflowY: 'auto', pr: 0.5 }}>
                {attendanceHistory.filter(r => r.totalHours && r.totalHours > 8.5).map((log, i) => {
                  const extraHrs = log.totalHours - 8.5;
                  return (
                    <Box 
                      key={i} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        p: 1.2, 
                        bgcolor: '#fff', 
                        borderRadius: 3, 
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {log.checkInSelfie ? (
                          <Avatar
                            src={log.checkInSelfie}
                            variant="rounded"
                            sx={{ width: 36, height: 36, borderRadius: 2, border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          <Avatar variant="rounded" sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#f1f5f9', color: '#94a3b8' }}>
                            <ProfileIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                        )}
                        <Box>
                          <Typography sx={{ fontSize: '11.5px', fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit' }}>
                            {new Date(log.attendanceDate).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                          <Typography sx={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'Inter', mt: 0.1 }}>
                            Total: {log.totalHours.toFixed(2)} hrs
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`+${extraHrs.toFixed(2)} hrs`}
                        size="small"
                        sx={{ height: 18, fontSize: '9px', fontWeight: 800, bgcolor: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button 
            onClick={() => setExtraShiftsOpen(false)} 
            variant="contained" 
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              bgcolor: '#1e293b', 
              fontSize: '11px', 
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#0f172a' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
