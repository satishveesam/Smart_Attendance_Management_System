import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeLayout from '../layouts/EmployeeLayout';
import API from '../api';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
  ChevronRight as ArrowIcon,
  CheckCircle as SuccessIcon,
  AssignmentTurnedIn as ChecklistIcon,
} from '@mui/icons-material';

const EmployeeAttendanceSummary = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Work entry states
  const [workEntryOpen, setWorkEntryOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [hoursSpent, setHoursSpent] = useState(8);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState('');
  const [taskError, setTaskError] = useState('');

  // Stats
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    fine: '0:00',
    overtime: '0:00',
    pendingApprovals: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch History
      const res = await API.get('/attendance/history');
      setHistory(res.data);

      // 2. Fetch Personal Leaves to count pending approvals
      const leavesRes = await API.get('/leaves/my');
      const pendingLeaves = leavesRes.data.filter(l => l.status === 'PENDING').length;

      // Calculate stats for selected month
      const targetMonth = selectedMonth.getMonth();
      const targetYear = selectedMonth.getFullYear();

      // Filter logs for this month
      const monthLogs = res.data.filter(log => {
        const d = new Date(log.attendanceDate);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });

      let presentCount = 0;
      let lateCount = 0;
      let halfDayCount = 0;
      let totalOvertimeMins = 0;

      monthLogs.forEach(log => {
        if (log.status === 'PRESENT') presentCount++;
        else if (log.status === 'LATE') lateCount++;
        else if (log.status === 'HALF_DAY') halfDayCount++;

        // Overtime calculation: check-out hour > 6:30 PM (18.5)
        if (log.totalHours && log.totalHours > 8.5) {
          totalOvertimeMins += Math.round((log.totalHours - 8.5) * 60);
        }
      });

      const otHours = Math.floor(totalOvertimeMins / 60);
      const otMins = totalOvertimeMins % 60;
      const overtimeStr = `${otHours}:${otMins.toString().padStart(2, '0')}`;

      setStats({
        present: presentCount + lateCount,
        absent: 0, // Mocked / Default
        halfDay: halfDayCount,
        leave: 0,
        fine: '0:00',
        overtime: overtimeStr,
        pendingApprovals: pendingLeaves
      });

    } catch (err) {
      console.error('Failed to fetch attendance summary details', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

  // Generate list of dates in the selected month
  const getDatesInMonth = () => {
    const dates = [];
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const lastDay = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    const maxDay = (today.getMonth() === month && today.getFullYear() === year) ? today.getDate() : lastDay;

    for (let day = maxDay; day >= 1; day--) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split('T')[0];

      const log = history.find(l => l.attendanceDate === dateStr);
      dates.push({
        dateObj,
        dateStr,
        log
      });
    }
    return dates;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <EmployeeLayout>
      <Box className="fade-in" sx={{ pb: { xs: 2, md: 4 } }}>
        
        {/* 1. Page Title Header */}
        <Box sx={{ mb: { xs: 2, md: 3.5 } }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Attendance History
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '12px', md: '14px' }, mt: 0.5 }}>
            View and track your monthly shift logs, check-in times, and overtimes
          </Typography>
        </Box>

        {/* 2. Month Selector Toolbar */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 1.5, 
          bgcolor: '#f8fafc', 
          p: 0.8, 
          borderRadius: 2, 
          border: '1px solid #e2e8f0' 
        }}>
          <IconButton size="small" onClick={handlePrevMonth}><LeftIcon sx={{ fontSize: 18 }} /></IconButton>
          <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b', fontFamily: 'Outfit' }}>
            {formatMonthName(selectedMonth)}
          </Typography>
          <IconButton size="small" onClick={handleNextMonth}><RightIcon sx={{ fontSize: 18 }} /></IconButton>
        </Box>

        {/* 3. Consolidated Statistics Row Card */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, bgcolor: '#fff', boxShadow: 'none' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexWrap: 'wrap', rowGap: 1.2, columnGap: 0.5 }}>
            {[
              { label: 'Present', val: `${stats.present}.0`, color: '#10b981' },
              { label: 'Absent', val: stats.absent, color: '#ef4444' },
              { label: 'Half Day', val: stats.halfDay, color: '#3b82f6' },
              { label: 'Leave', val: stats.leave, color: '#f59e0b' },
              { label: 'Overtime', val: stats.overtime, color: '#8b5cf6' },
              { label: 'Fine', val: stats.fine, color: '#ef4444' }
            ].map((stat) => (
              <Box key={stat.label} sx={{ minWidth: { xs: '30%', sm: '15%' }, textAlign: 'center', flexGrow: 1, py: 0.3 }}>
                <Typography sx={{ color: '#64748b', fontWeight: 'bold', fontSize: '8px', textTransform: 'uppercase', mb: 0.2 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '12px', color: stat.color, fontFamily: 'Outfit' }}>
                  {stat.val}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* 4. Pending Approvals Alert */}
        {stats.pendingApprovals > 0 && (
          <Paper sx={{ p: 1, px: 1.5, mb: 2, bgcolor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, boxShadow: 'none' }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef4444' }} />
            <Typography sx={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '10.5px', fontFamily: 'Inter' }}>
              {stats.pendingApprovals} Leave/WFH Approvals Pending
            </Typography>
          </Paper>
        )}

        {/* 5. Daily Work Entry compact button */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ChecklistIcon sx={{ fontSize: 16 }} />}
          onClick={() => setWorkEntryOpen(true)}
          sx={{
            mb: 2,
            py: 0.8,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold',
            borderColor: '#e2e8f0',
            color: '#334155',
            fontSize: '11px',
            '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
          }}
        >
          Log Today's Work Entry
        </Button>

        {/* 6. Attendance Summary List */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff', boxShadow: 'none' }}>
          <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5 } }}>
            <Typography sx={{ fontWeight: 'bold', px: 1.5, py: 1.2, color: '#1e293b', fontFamily: 'Outfit', fontSize: '13px' }}>
              Attendance Logs
            </Typography>
            <Divider />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
            ) : (
              <List sx={{ p: 0 }}>
                {getDatesInMonth().map((item, idx) => {
                  const dateObj = item.dateObj;
                  const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                  const formattedDay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                  let statusText = 'Not Marked';
                  let timingText = '0:00 Hrs';
                  let statusColor = '#64748b';

                  if (item.log) {
                    statusText = item.log.status.replace('_', ' ');
                    if (item.log.status === 'PRESENT') {
                      statusColor = '#10b981';
                    } else if (item.log.status === 'LATE') {
                      statusColor = '#f59e0b';
                    } else if (item.log.status === 'HALF_DAY') {
                      statusColor = '#3b82f6';
                    }

                    if (item.log.checkIn) {
                      timingText = `${formatTime(item.log.checkIn)} - ${item.log.checkOut ? formatTime(item.log.checkOut) : 'Active'}`;
                    }
                  } else if (isWeekend) {
                    statusText = 'Weekend';
                    timingText = 'Off Day';
                    statusColor = '#94a3b8';
                  }

                  return (
                    <React.Fragment key={item.dateStr}>
                      {idx > 0 && <Divider />}
                      <ListItem disablePadding>
                        <ListItemButton
                          disabled={!item.log}
                          onClick={() => navigate(`/employee/attendance-detail/${item.dateStr}`)}
                          sx={{ py: 1, px: 1.5, borderRadius: 2 }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: '12px' }}>
                                    {formattedDate}
                                  </Typography>
                                  <Typography sx={{ color: '#64748b', fontSize: '9.5px' }}>
                                    {formattedDay}
                                  </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right', mr: 1.5 }}>
                                  <Typography sx={{ fontWeight: 'bold', color: statusColor, fontSize: '11px' }}>
                                    {statusText}
                                  </Typography>
                                  <Typography sx={{ color: '#94a3b8', fontSize: '9px' }}>
                                    {timingText}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                          {item.log && <ArrowIcon sx={{ color: '#cbd5e1', fontSize: 16 }} />}
                        </ListItemButton>
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>

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
      </Box>
    </EmployeeLayout>
  );
};

export default EmployeeAttendanceSummary;
