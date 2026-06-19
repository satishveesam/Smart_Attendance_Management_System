package com.attendance.repository;

import com.attendance.entity.AttendanceLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttendanceLocationRepository extends JpaRepository<AttendanceLocation, Long> {
    List<AttendanceLocation> findByAttendanceId(Long attendanceId);
}
