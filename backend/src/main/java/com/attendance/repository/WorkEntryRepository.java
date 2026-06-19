package com.attendance.repository;

import com.attendance.entity.WorkEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkEntryRepository extends JpaRepository<WorkEntry, Long> {
    List<WorkEntry> findByEmployeeIdOrderByEntryDateDesc(Long employeeId);
    Optional<WorkEntry> findByEmployeeIdAndEntryDate(Long employeeId, LocalDate entryDate);
    List<WorkEntry> findByEntryDateBetweenOrderByEntryDateDesc(LocalDate startDate, LocalDate endDate);
}
