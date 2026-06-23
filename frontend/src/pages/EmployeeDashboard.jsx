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
  History as HistoryIcon,
  Face as ProfileIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
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

  // Dynamic broadcast states
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);

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
      
      const sortedAttendance = attRes.data.sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate));
      setAttendanceHistory(sortedAttendance);
      setLeaveHistory(leaveRes.data);

      const todayStr = new Date().toLocaleDateString('sv-SE');
      const todayRecord = sortedAttendance.find((r) => r.attendanceDate === todayStr);
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
      if (title === 'Broadcast Board') {
        setLoadingBroadcasts(true);
        setInfoDialogOpen(true);
        API.get('/broadcasts')
          .then((res) => {
            const activeBroadcasts = res.data.filter((b) => b.active);
            setBroadcasts(activeBroadcasts);
          })
          .catch((err) => {
            console.error('Failed to fetch broadcasts', err);
          })
          .finally(() => {
            setLoadingBroadcasts(false);
          });
      } else if (title === 'Salary Overview') {
        if (profile && profile.netTakeHome !== null && profile.netTakeHome !== undefined) {
          const bp = profile.basicPay ? `₹${profile.basicPay.toLocaleString('en-IN')}` : '₹0';
          const hra = profile.hra ? `₹${profile.hra.toLocaleString('en-IN')}` : '₹0';
          const sa = profile.specialAllowance ? `₹${profile.specialAllowance.toLocaleString('en-IN')}` : '₹0';
          const ded = profile.deductions ? `₹${profile.deductions.toLocaleString('en-IN')}` : '₹0';
          const net = profile.netTakeHome ? `₹${profile.netTakeHome.toLocaleString('en-IN')}` : '₹0';
          setDialogContent(`Current Month Salary Status: Active\n\nBasic Pay: ${bp}\nHRA: ${hra}\nSpecial Allowance: ${sa}\nDeductions (PF/Tax): ${ded}\n\nNet Take Home: ${net}`);
        } else {
          setDialogContent('Salary details are not configured for your profile.\nPlease contact Human Resources.');
        }
      } else if (title === 'Salary Slips') {
        setDialogContent('Available Payslips:\n• May 2026 - Paid (Download PDF)\n• Apr 2026 - Paid (Download PDF)\n• Mar 2026 - Paid (Download PDF)');
      } else if (title === 'Loan' || title === 'Loan Request') {
        setDialogContent('No active loans found.\nMaximum eligible advance loan amount: ₹50,000.\nClick Apply to request an advance salary loan.');
      } else if (title === 'Roster Schedule') {
        setDialogContent(profile?.rosterSchedule ? `Shift Schedule:\n${profile.rosterSchedule}` : 'Shift Schedule:\nGeneral Shift (10:00 AM - 06:30 PM)\nWeekly Offs: Saturday, Sunday');
      } else if (title === 'Late Entries') {
        const lateLogs = attendanceHistory.filter(log => log.status === 'LATE');
        if (lateLogs.length > 0) {
          const listText = lateLogs.map(log => {
            const dateObj = new Date(log.attendanceDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
            const checkInTime = log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
            return `• ${formattedDate}: checked in at ${checkInTime}`;
          }).join('\n');
          setDialogContent(`You have ${lateLogs.length} late entry/entries:\n\n${listText}`);
        } else {
          setDialogContent('Congratulations! You have 0 late entries. Keep up the good work! 🎉');
        }
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
        entryDate: new Date().toLocaleDateString('sv-SE'),
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

  // Helper to format duration
  const formatDuration = (totalHours) => {
    if (totalHours === null || totalHours === undefined) return '';
    const totalMinutes = Math.round(totalHours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Compute stats metrics
  const presentDays = attendanceHistory.filter(r => r.checkIn).length;
  const lateDays = attendanceHistory.filter(r => r.status === 'LATE').length;
  const approvedLeaves = leaveHistory.filter(l => l.status === 'APPROVED').length;
  const pendingLeaves = leaveHistory.filter(l => l.status === 'PENDING').length;

  // Calculate extra hours (over 8 hours)
  let totalExtraMins = 0;
  attendanceHistory.forEach(log => {
    if (log.totalHours && log.totalHours > 8.0) {
      totalExtraMins += Math.round((log.totalHours - 8.0) * 60);
    }
  });
  const extraHours = Math.floor(totalExtraMins / 60);
  const extraMins = totalExtraMins % 60;
  const extraHoursStr = extraHours > 0 || extraMins > 0 ? `${extraHours}h ${extraMins}m` : '0h';

  // Actions menu
  const primaryActions = [
    { title: 'Mark Attendance', icon: <CheckInIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#10b981' }} />, path: '/employee/attendance/mark', bg: '#f0fdf4' },
    { title: 'Attendance Logs', icon: <HistoryIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#3b82f6' }} />, path: '/employee/attendance', bg: '#eff6ff' },
    { title: 'Apply Leaves', icon: <LeaveIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#f59e0b' }} />, path: '/employee/leaves', bg: '#fffbeb' },
    { title: 'Daily Work Entry', icon: <TasksIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#4f46e5' }} />, action: 'work-entry', bg: '#e0e7ff' },
    { title: 'Face Registration', icon: <ProfileIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#ec4899' }} />, path: '/employee/profile', bg: '#fdf2f8' },
    { title: 'Late Entries', icon: <WarningIcon sx={{ fontSize: { xs: 16, sm: 22 }, color: '#f59e0b' }} />, bg: '#fffbeb' },
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
                <Typography sx={{ color: '#ef4444', fontSize: '8px', display: 'block' }}>
                  {lateDays} late entries
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              {/* Stat 2: Leaves */}
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

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              {/* Stat 3: Today's Status */}
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
                      : todayLog?.status === 'EXTRA_SHIFT'
                      ? 'secondary'
                      : 'default'
                  }
                  sx={{
                    height: 16,
                    fontSize: '8px',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    '& .MuiChip-label': { px: 0.8 },
                    bgcolor: todayLog?.status === 'EXTRA_SHIFT' ? '#8b5cf6' : undefined,
                    color: todayLog?.status === 'EXTRA_SHIFT' ? '#fff' : undefined,
                  }}
                />
                <Typography sx={{ color: '#64748b', fontSize: '8px', display: 'block', mt: 0.3 }}>
                  {todayLog?.checkIn
                    ? `In: ${new Date(todayLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : '10:00 AM Shift'}
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              {/* Stat 4: Extra Hours */}
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold', display: 'block', fontSize: '9px', letterSpacing: '0.5px', mb: 0.5 }}>
                  EXTRA HOURS
                </Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#8b5cf6', fontFamily: 'Outfit' }}>
                  {extraHoursStr}
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '8px', display: 'block' }}>
                  Shift threshold: 8h
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* 3. Core Action Grid */}
          <Typography sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1, fontFamily: 'Outfit', fontSize: { xs: '12px', sm: '14px' } }}>
            Core Actions & Services
          </Typography>
          
          <Grid container spacing={1} sx={{ mb: 2.5 }}>
            {primaryActions.map((action) => (
              <Grid item xs={3} sm={2.4} md={2} key={action.title}>
                <Paper
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
              </Grid>
            ))}
          </Grid>

          {/* 4. Recent Logs / Feed */}
          {attendanceHistory.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1, fontFamily: 'Outfit', fontSize: { xs: '12px', sm: '14px' } }}>
                Recent Attendance Activities
              </Typography>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 0.5 }}>
                  <List sx={{ py: 0 }}>
                    {attendanceHistory.slice(0, 3).map((log, index) => (
                      <React.Fragment key={log.id || index}>
                        {index > 0 && <Divider />}
                        <ListItem sx={{ py: 0.8, px: { xs: 1, sm: 2 } }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <TimeIcon sx={{ color: log.status === 'LATE' ? '#f59e0b' : '#10b981', fontSize: 15 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '11px', sm: '12px' }, color: '#1e293b' }}>
                                {new Date(log.attendanceDate).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '9px' }}>
                                In: {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                {log.checkOut ? ` | Out: ${new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                                {log.totalHours ? ` (Duration: ${formatDuration(log.totalHours)})` : ''}
                              </Typography>
                            }
                          />
                          <Chip
                            label={log.status}
                            size="small"
                            color={
                              log.status === 'PRESENT'
                                ? 'success'
                                : log.status === 'LATE'
                                ? 'warning'
                                : log.status === 'EXTRA_SHIFT'
                                ? 'secondary'
                                : 'error'
                            }
                            sx={{
                              height: 16,
                              fontSize: '8px',
                              fontWeight: 'bold',
                              bgcolor: log.status === 'EXTRA_SHIFT' ? '#8b5cf6' : undefined,
                              color: log.status === 'EXTRA_SHIFT' ? '#fff' : undefined,
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
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: { xs: '15px', sm: '17px' }, fontFamily: 'Outfit' }}>{dialogTitle}</DialogTitle>
        <DialogContent>
          {dialogTitle === 'Broadcast Board' ? (
            loadingBroadcasts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : broadcasts.length === 0 ? (
              <Typography sx={{ color: '#64748b', fontSize: '12px', fontFamily: 'Inter', textAlign: 'center', py: 2 }}>
                No active announcements at this time.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxIdWidth: '100%', minWidth: { xs: 260, sm: 380 } }}>
                {broadcasts.map((b) => (
                  <Box key={b.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px', fontFamily: 'Outfit' }}>
                      📢 {b.title}
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '9px', fontFamily: 'Inter', mt: 0.5 }}>
                      Published: {new Date(b.createdAt).toLocaleDateString()}
                    </Typography>
                    <Divider sx={{ my: 1, borderColor: '#e2e8f0' }} />
                    <Typography sx={{ color: '#475569', fontSize: '12px', fontFamily: 'Inter', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {b.message}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )
          ) : (
            <Typography sx={{ whiteSpace: 'pre-line', color: '#475569', fontSize: { xs: '11.5px', sm: '13px' }, fontFamily: 'Inter' }}>
              {dialogContent}
            </Typography>
          )}
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
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
