package com.attendance.repository;

import com.attendance.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployeeIdOrderByAppliedOnDesc(Long employeeId);
    List<LeaveRequest> findByStatusOrderByAppliedOnDesc(LeaveRequest.LeaveStatus status);
    List<LeaveRequest> findByEmployeeIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long employeeId, LeaveRequest.LeaveStatus status, LocalDate date1, LocalDate date2);
}
