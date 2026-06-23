package com.attendance.controller;

import com.attendance.entity.Broadcast;
import com.attendance.repository.BroadcastRepository;
import com.attendance.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/broadcasts")
public class BroadcastController {

    @Autowired
    private BroadcastRepository broadcastRepository;

    @GetMapping
    public ResponseEntity<List<Broadcast>> getAllBroadcasts() {
        List<Broadcast> broadcasts = broadcastRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(broadcasts);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Broadcast> createBroadcast(@Valid @RequestBody Broadcast broadcast) {
        Broadcast saved = broadcastRepository.save(broadcast);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Broadcast> updateBroadcast(
            @PathVariable("id") Long id,
            @Valid @RequestBody Broadcast broadcastDetails) {
        Broadcast broadcast = broadcastRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Broadcast not found with id: " + id));

        broadcast.setTitle(broadcastDetails.getTitle());
        broadcast.setMessage(broadcastDetails.getMessage());
        broadcast.setActive(broadcastDetails.isActive());

        Broadcast updated = broadcastRepository.save(broadcast);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteBroadcast(@PathVariable("id") Long id) {
        Broadcast broadcast = broadcastRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Broadcast not found with id: " + id));

        broadcastRepository.delete(broadcast);
        return ResponseEntity.ok().build();
    }
}
