package com.attendance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
public class AttendanceManagementApplication {

	@PostConstruct
	public void init() {
		// Set JVM timezone to Indian Standard Time (Asia/Kolkata)
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
	}

	public static void main(String[] args) {
		SpringApplication.run(AttendanceManagementApplication.class, args);
	}

}
