package com.attendance.repository;

import com.attendance.entity.AttendanceRequest;
import com.attendance.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRequestRepository extends JpaRepository<AttendanceRequest, Long> {
    List<AttendanceRequest> findByEmployeeIdOrderByAttendanceDateDesc(Long employeeId);
    List<AttendanceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);
    List<AttendanceRequest> findAllByOrderByCreatedAtDesc();
}
