package com.attendance.service;

import com.attendance.dto.EmployeeDto;
import com.attendance.entity.Employee;
import com.attendance.entity.Role;
import com.attendance.entity.User;
import com.attendance.exception.BadRequestException;
import com.attendance.exception.ResourceNotFoundException;
import com.attendance.repository.EmployeeRepository;
import com.attendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<EmployeeDto> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return mapToDto(employee);
    }

    @Transactional(readOnly = true)
    public List<EmployeeDto> searchEmployees(String term) {
        if (term == null || term.trim().isEmpty()) {
            return getAllEmployees();
        }
        return employeeRepository.searchEmployees(term).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeDto createEmployee(EmployeeDto dto) {
        if (employeeRepository.existsByEmployeeCode(dto.getEmployeeCode())) {
            throw new BadRequestException("Employee Code is already taken!");
        }
        if (employeeRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email is already registered!");
        }
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new BadRequestException("Username is already taken!");
        }

        // Set default password as "Welcome@123" for new employees
        User user = User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .password(passwordEncoder.encode("Welcome@123"))
                .role(dto.getRole() != null ? Role.valueOf(dto.getRole()) : Role.ROLE_EMPLOYEE)
                .build();

        User savedUser = userRepository.save(user);

        Employee employee = Employee.builder()
                .employeeCode(dto.getEmployeeCode())
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .department(dto.getDepartment())
                .designation(dto.getDesignation())
                .joiningDate(dto.getJoiningDate())
                .user(savedUser)
                .customLatitude(dto.getCustomLatitude())
                .customLongitude(dto.getCustomLongitude())
                .customRadiusMeters(dto.getCustomRadiusMeters())
                .bankName(dto.getBankName())
                .accountNumber(dto.getAccountNumber())
                .ifscCode(dto.getIfscCode())
                .branchName(dto.getBranchName())
                .build();

        Employee savedEmployee = employeeRepository.save(employee);
        return mapToDto(savedEmployee);
    }

    @Transactional
    public EmployeeDto updateEmployee(Long id, EmployeeDto dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        // Check uniqueness if fields changed
        if (!employee.getEmployeeCode().equals(dto.getEmployeeCode()) && 
            employeeRepository.existsByEmployeeCode(dto.getEmployeeCode())) {
            throw new BadRequestException("Employee Code is already taken!");
        }
        if (!employee.getEmail().equals(dto.getEmail()) && 
            employeeRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email is already registered!");
        }

        employee.setEmployeeCode(dto.getEmployeeCode());
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setEmail(dto.getEmail());
        employee.setPhone(dto.getPhone());
        employee.setDepartment(dto.getDepartment());
        employee.setDesignation(dto.getDesignation());
        employee.setJoiningDate(dto.getJoiningDate());
        employee.setCustomLatitude(dto.getCustomLatitude());
        employee.setCustomLongitude(dto.getCustomLongitude());
        employee.setCustomRadiusMeters(dto.getCustomRadiusMeters());
        employee.setBankName(dto.getBankName());
        employee.setAccountNumber(dto.getAccountNumber());
        employee.setIfscCode(dto.getIfscCode());
        employee.setBranchName(dto.getBranchName());

        // Update corresponding user email
        if (employee.getUser() != null) {
            User user = employee.getUser();
            user.setEmail(dto.getEmail());
            if (dto.getRole() != null) {
                user.setRole(Role.valueOf(dto.getRole()));
            }
            userRepository.save(user);
        }

        Employee updatedEmployee = employeeRepository.save(employee);
        return mapToDto(updatedEmployee);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        // Deleting employee will delete the linked user due to cascade
        employeeRepository.delete(employee);
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployeeByUserId(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for user: " + userId));
        return mapToDto(employee);
    }

    private EmployeeDto mapToDto(Employee employee) {
        EmployeeDto.EmployeeDtoBuilder builder = EmployeeDto.builder()
                .id(employee.getId())
                .employeeCode(employee.getEmployeeCode())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .department(employee.getDepartment())
                .designation(employee.getDesignation())
                .joiningDate(employee.getJoiningDate())
                .customLatitude(employee.getCustomLatitude())
                .customLongitude(employee.getCustomLongitude())
                .customRadiusMeters(employee.getCustomRadiusMeters())
                .bankName(employee.getBankName())
                .accountNumber(employee.getAccountNumber())
                .ifscCode(employee.getIfscCode())
                .branchName(employee.getBranchName());

        if (employee.getUser() != null) {
            builder.userId(employee.getUser().getId())
                   .username(employee.getUser().getUsername())
                   .role(employee.getUser().getRole().name());
        }

        return builder.build();
    }

    @Transactional
    public void resetEmployeePassword(Long employeeId, String newPassword) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));
        if (employee.getUser() != null) {
            User user = employee.getUser();
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
        } else {
            throw new BadRequestException("No user account is linked to this employee profile.");
        }
    }
}
