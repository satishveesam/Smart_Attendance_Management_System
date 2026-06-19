package com.attendance.controller;

import com.attendance.dto.FaceRegisterRequest;
import com.attendance.entity.User;
import com.attendance.service.FaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/face")
public class FaceController {

    @Autowired
    private FaceService faceService;

    @PostMapping("/register")
    public ResponseEntity<?> registerFace(@AuthenticationPrincipal User user, @RequestBody FaceRegisterRequest request) {
        faceService.registerFace(user.getId(), request.getFaceDescriptor());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Face biometrics template registered successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<?> getFaceStatus(@AuthenticationPrincipal User user) {
        boolean registered = faceService.isFaceRegistered(user.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("registered", registered);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/descriptor")
    public ResponseEntity<?> getFaceDescriptor(@AuthenticationPrincipal User user) {
        String descriptor = faceService.getFaceDescriptor(user.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("faceDescriptor", descriptor);
        return ResponseEntity.ok(response);
    }
}
