package com.attendance.repository;

import com.attendance.entity.Attendance;
import com.attendance.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);
    List<Attendance> findByAttendanceDate(LocalDate attendanceDate);
    List<Attendance> findByAttendanceDateBetween(LocalDate startDate, LocalDate endDate);
    List<Attendance> findByEmployeeIdAndAttendanceDateBetween(Long employeeId, LocalDate startDate, LocalDate endDate);
    List<Attendance> findByEmployeeId(Long employeeId);
    
    long countByAttendanceDateAndStatus(LocalDate date, AttendanceStatus status);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.attendanceDate = :date")
    long countPresentToday(@Param("date") LocalDate date);
}
