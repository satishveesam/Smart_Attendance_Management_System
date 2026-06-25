package com.attendance.controller;

import com.attendance.entity.SystemSetting;
import com.attendance.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SystemSettingController {

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @GetMapping
    public ResponseEntity<List<SystemSetting>> getAllSettings() {
        return ResponseEntity.ok(systemSettingRepository.findAll());
    }

    @GetMapping("/{key}")
    public ResponseEntity<SystemSetting> getSettingByKey(@PathVariable("key") String key) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElseGet(() -> {
                    String defaultValue = "";
                    if ("roster_schedule".equals(key)) {
                        defaultValue = "Shift Schedule:\nGeneral Shift (10:00 AM - 06:30 PM)\nWeekly Offs: Saturday, Sunday";
                    } else if ("broadcast_message".equals(key)) {
                        defaultValue = "📢 Notice: Biometric facial check-in is mandatory for all office working days.\n📢 Update: System upgrading scheduled on Sunday 2:00 AM.";
                    }
                    return SystemSetting.builder().settingKey(key).settingValue(defaultValue).build();
                });
        return ResponseEntity.ok(setting);
    }

    @PostMapping
    public ResponseEntity<?> updateSetting(@RequestBody Map<String, String> payload) {
        String key = payload.get("settingKey");
        String value = payload.get("settingValue");
        if (key == null || key.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "settingKey is required"));
        }

        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElse(SystemSetting.builder().settingKey(key).build());
        setting.setSettingValue(value);
        systemSettingRepository.save(setting);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Setting updated successfully");
        response.put("setting", setting);
        return ResponseEntity.ok(response);
    }
}
