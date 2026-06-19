package com.attendance.config;

import com.attendance.entity.*;
import com.attendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        Optional<User> adminOpt = userRepository.findByUsername("ADMIN");
        if (adminOpt.isPresent()) {
            User adminUser = adminOpt.get();
            adminUser.setUsername("ADMIN");
            adminUser.setPassword(passwordEncoder.encode("ADMIN123"));
            adminUser.setRole(Role.ROLE_ADMIN);
            userRepository.save(adminUser);
        } else {
            // Seed Admin User
            User adminUser = User.builder()
                    .username("ADMIN")
                    .email("admin@attendance.com")
                    .password(passwordEncoder.encode("ADMIN123"))
                    .role(Role.ROLE_ADMIN)
                    .build();

            User savedUser = userRepository.save(adminUser);

            // Seed Admin Employee profile
            Employee adminEmployee = Employee.builder()
                    .employeeCode("EMP000")
                    .firstName("System")
                    .lastName("Admin")
                    .email("admin@attendance.com")
                    .phone("1234567890")
                    .department("IT")
                    .designation("System Administrator")
                    .joiningDate(LocalDate.now())
                    .user(savedUser)
                    .build();

            employeeRepository.save(adminEmployee);
        }

        if (userRepository.count() <= 1) {
            // Seed a sample Employee for quick testing
            User sampleUser = User.builder()
                    .username("john_doe")
                    .email("john@attendance.com")
                    .password(passwordEncoder.encode("employee123"))
                    .role(Role.ROLE_EMPLOYEE)
                    .build();
            
            User savedSampleUser = userRepository.save(sampleUser);
            
            Employee sampleEmployee = Employee.builder()
                    .employeeCode("EMP001")
                    .firstName("John")
                    .lastName("Doe")
                    .email("john@attendance.com")
                    .phone("9876543210")
                    .department("Engineering")
                    .designation("Software Engineer")
                    .joiningDate(LocalDate.now().minusMonths(6))
                    .user(savedSampleUser)
                    .build();
            
            employeeRepository.save(sampleEmployee);
        }
    }
}
