package com.cinemind.service;

import com.cinemind.common.ConflictException;
import com.cinemind.common.ResourceNotFoundException;
import com.cinemind.domain.entity.TasteProfile;
import com.cinemind.domain.entity.User;
import com.cinemind.dto.AuthResponse;
import com.cinemind.dto.LoginRequest;
import com.cinemind.dto.RegisterRequest;
import com.cinemind.dto.UserDto;
import com.cinemind.repository.TasteProfileRepository;
import com.cinemind.repository.UserRepository;
import com.cinemind.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TasteProfileRepository tasteProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }
        if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new ConflictException("Username already taken");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .username(request.getUsername().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);

        // Initialize empty taste profile
        TasteProfile tasteProfile = TasteProfile.builder()
                .user(user)
                .topGenresJson("{}")
                .build();
        tasteProfileRepository.save(tasteProfile);

        String token = tokenProvider.generateTokenFromUser(user.getId(), user.getUsername());

        return AuthResponse.builder()
                .user(mapToDto(user))
                .token(token)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getIdentifier(), request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsernameIgnoreCase(request.getIdentifier())
                .or(() -> userRepository.findByEmailIgnoreCase(request.getIdentifier()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return AuthResponse.builder()
                .user(mapToDto(user))
                .token(token)
                .build();
    }

    public UserDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToDto(user);
    }

    public UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
