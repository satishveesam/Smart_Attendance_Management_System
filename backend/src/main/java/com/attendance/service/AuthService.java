package com.attendance.service;

import com.attendance.dto.*;
import com.attendance.entity.*;
import com.attendance.exception.BadRequestException;
import com.attendance.repository.*;
import com.attendance.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Transactional
    public User registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new BadRequestException("Username is already taken!");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new BadRequestException("Email Address already in use!");
        }
        
        if (employeeRepository.existsByEmployeeCode(registerRequest.getEmployeeCode())) {
            throw new BadRequestException("Employee Code already registered!");
        }

        // Create User accounts (Default: ROLE_EMPLOYEE, unless registration requests admin specifically)
        // If registering "admin" username, default to ROLE_ADMIN.
        Role role = Role.ROLE_EMPLOYEE;
        if (registerRequest.getUsername().toLowerCase().contains("admin")) {
            role = Role.ROLE_ADMIN;
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(role)
                .build();

        User savedUser = userRepository.save(user);

        // Create Employee profiles
        Employee employee = Employee.builder()
                .employeeCode(registerRequest.getEmployeeCode())
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .email(registerRequest.getEmail())
                .phone(registerRequest.getPhone())
                .department(registerRequest.getDepartment())
                .designation(registerRequest.getDesignation())
                .joiningDate(registerRequest.getJoiningDate())
                .user(savedUser)
                .build();

        employeeRepository.save(employee);

        return savedUser;
    }

    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = (User) authentication.getPrincipal();
        
        Long employeeId = null;
        String employeeCode = null;
        
        Optional<Employee> employeeOpt = employeeRepository.findByUserId(user.getId());
        if (employeeOpt.isPresent()) {
            employeeId = employeeOpt.get().getId();
            employeeCode = employeeOpt.get().getEmployeeCode();
        }

        return AuthResponse.builder()
                .token(jwt)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .employeeId(employeeId)
                .employeeCode(employeeCode)
                .build();
    }
}
