package com.attendance.service;

import com.attendance.entity.Employee;
import com.attendance.entity.FaceData;
import com.attendance.repository.EmployeeRepository;
import com.attendance.repository.FaceDataRepository;
import com.attendance.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class FaceService {

    @Autowired
    private FaceDataRepository faceDataRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Transactional
    public void registerFace(Long userId, String faceDescriptor) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found for current user account"));

        Optional<FaceData> existingFaceData = faceDataRepository.findByEmployeeId(employee.getId());
        
        FaceData faceData;
        if (existingFaceData.isPresent()) {
            faceData = existingFaceData.get();
            faceData.setFaceDescriptor(faceDescriptor);
        } else {
            faceData = FaceData.builder()
                    .employee(employee)
                    .faceDescriptor(faceDescriptor)
                    .imagePath("biometrics/employee_" + employee.getId() + ".png")
                    .build();
        }
        
        faceDataRepository.save(faceData);
    }

    @Transactional(readOnly = true)
    public boolean isFaceRegistered(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return faceDataRepository.findByEmployeeId(employee.getId()).isPresent();
    }

    @Transactional(readOnly = true)
    public String getFaceDescriptor(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        FaceData faceData = faceDataRepository.findByEmployeeId(employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Face template not registered for this employee"));
        return faceData.getFaceDescriptor();
    }
}
