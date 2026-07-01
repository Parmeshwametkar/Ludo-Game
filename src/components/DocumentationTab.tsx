import React, { useState } from 'react';
import { Database, ShieldAlert, Code, Server, Copy, Check, FileCode, Cpu } from 'lucide-react';

export default function DocumentationTab() {
  const [activeSubTab, setActiveSubTab] = useState<'mysql' | 'spring' | 'websocket' | 'ai' | 'deployment'>('mysql');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const codeSnippets = {
    mysql: `/*
====================================================================
  ULTIMATE LUDO ARENA - PRODUCTION MYSQL SCHEMAS (Normalized & Indexed)
====================================================================
*/

-- 1. Users & Profiles Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_id VARCHAR(50) DEFAULT 'avatar_1',
    coins INT DEFAULT 5000,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- 2. Security Roles Table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 3. Game Matches Table
CREATE TABLE matches (
    id VARCHAR(50) PRIMARY KEY,
    mode VARCHAR(20) NOT NULL, -- 'AI', 'LOCAL', 'ONLINE'
    status VARCHAR(20) NOT NULL, -- 'WAITING', 'IN_PROGRESS', 'FINISHED'
    winner_user_id BIGINT,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_user_id) REFERENCES users(id)
);

-- 4. Match Players (Participant details)
CREATE TABLE match_players (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    color VARCHAR(10) NOT NULL, -- 'RED', 'GREEN', 'YELLOW', 'BLUE'
    is_ai BOOLEAN DEFAULT FALSE,
    finish_rank INT DEFAULT NULL,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_match_player (match_id, user_id)
);

-- 5. Game Live Token Positions (For Reconnection Persistence)
CREATE TABLE token_positions (
    match_id VARCHAR(50) NOT NULL,
    token_id INT NOT NULL, -- 0, 1, 2, 3
    player_color VARCHAR(10) NOT NULL,
    position INT NOT NULL DEFAULT -1, -- -1 for Base, 0-51 path, 52+ Home path
    step_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (match_id, player_color, token_id),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- 6. Leaderboards View Table
CREATE TABLE leaderboards (
    user_id BIGINT PRIMARY KEY,
    total_matches INT DEFAULT 0,
    wins INT DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_win_rate (win_rate DESC)
);

-- 7. Friends List Table
CREATE TABLE friends (
    user_id BIGINT NOT NULL,
    friend_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'ACCEPTED', 'BLOCKED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Default Roles
INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_ADMIN');
`,

    spring: `package com.ludo.game.controller;

import com.ludo.game.dto.AuthRequest;
import com.ludo.game.dto.AuthResponse;
import com.ludo.game.dto.RegisterRequest;
import com.ludo.game.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestParam String email) {
        authService.initiatePasswordReset(email);
        return ResponseEntity.ok("Verification email sent successfully.");
    }
}

// ==========================================
// User Profile Service & Controller
// ==========================================
package com.ludo.game.controller;

import com.ludo.game.dto.UserProfileDto;
import com.ludo.game.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getUserProfile(userDetails.getUsername()));
    }

    @PutMapping("/profile/avatar")
    public ResponseEntity<UserProfileDto> updateAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String avatarId) {
        return ResponseEntity.ok(userService.updateAvatar(userDetails.getUsername(), avatarId));
    }
}
`,

    websocket: `package com.ludo.game.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-ludo")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}

// ========================================================
// Real-Time Matchmaking & Move Synchronizer Controller
// ========================================================
package com.ludo.game.controller;

import com.ludo.game.model.GameAction;
import com.ludo.game.model.GameState;
import com.ludo.game.service.GameEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final GameEngineService gameEngineService;

    @MessageMapping("/room/{roomId}/roll")
    @SendTo("/topic/room/{roomId}")
    public GameState rollDice(@DestinationVariable String roomId, @Payload String playerColor) {
        return gameEngineService.processDiceRoll(roomId, playerColor);
    }

    @MessageMapping("/room/{roomId}/move")
    public void moveToken(
            @DestinationVariable String roomId, 
            @Payload GameAction action) {
        
        GameState updatedState = gameEngineService.processTokenMove(roomId, action);
        
        // Broadcast game updates to all active players in the room
        messagingTemplate.convertAndSend("/topic/room/" + roomId, updatedState);
    }

    @MessageMapping("/room/{roomId}/chat")
    @SendTo("/topic/room/{roomId}/chat")
    public ChatMessage sendChat(
            @DestinationVariable String roomId, 
            @Payload ChatMessage message) {
        return message; // Echoes and broadcasts chat to room channel
    }
}
`,

    ai: `package com.ludo.game.ai;

import com.ludo.game.model.Token;
import com.ludo.game.model.GameState;
import com.ludo.game.model.PlayerColor;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Enterprise Intelligent AI player decision model.
 */
public class LudoAiEngine {

    public static Token chooseOptimalMove(GameState state, PlayerColor aiColor, int diceValue, String difficulty) {
        List<Token> movableTokens = state.getMovableTokensFor(aiColor, diceValue);
        if (movableTokens.isEmpty()) return null;
        if (movableTokens.size() == 1) return movableTokens.get(0);

        // Easy: Picks a random token
        if ("EASY".equalsIgnoreCase(difficulty)) {
            return movableTokens.get((int) (Math.random() * movableTokens.size()));
        }

        // Hard & Medium weighting logic
        Token bestToken = null;
        double bestScore = -99999.0;

        for (Token token : movableTokens) {
            double score = 0.0;

            // 1. Prioritize Capture (+1000 points)
            if (state.willCaptureOpponent(token, diceValue)) {
                score += 1000.0;
            }

            // 2. Prioritize Reaching Home (+500 points)
            int targetPos = token.getPosition() + diceValue;
            if (targetPos == 57) {
                score += 500.0;
            }

            // 3. Unlock token from base (+400 points)
            if (token.getPosition() == -1 && diceValue == 6) {
                score += 400.0;
            }

            // 4. Escape Danger/Capture (+300 points)
            if (state.isTokenInDanger(token) && !state.isTokenInDangerAfterMove(token, diceValue)) {
                score += 300.0;
            }

            // 5. Hard Mode: Protect partners and create blocks (+200 points)
            if ("HARD".equalsIgnoreCase(difficulty)) {
                if (state.willLandsOnSafeZone(token, diceValue)) {
                    score += 250.0;
                }
                // Favor tokens closer to home, unless capturing
                score += (token.getStepCount() * 0.5);
            }

            if (score > bestScore) {
                bestScore = score;
                bestToken = token;
            }
        }

        return bestToken != null ? bestToken : movableTokens.get(0);
    }
}
`,

    deployment: `# Multi-stage Build Dockerfile for deployment

# Stage 1: Build React SPA
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Package Spring Boot API
FROM maven:3.9-eclipse-temurin-17 AS backend-builder
WORKDIR /backend
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 3: Runner stage merging both static assets & fat jar
FROM eclipse-temurin:17-jre-alpine
WORKDIR /deploy
COPY --from=backend-builder /backend/target/ludo-game-0.0.1-SNAPSHOT.jar app.jar
COPY --from=frontend-builder /app/dist ./static

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]


# ==========================================
# docker-compose.yml configuration
# ==========================================
version: '3.8'
services:
  db:
    image: mysql:8.0
    container_name: ludo_db
    restart: always
    environment:
      MYSQL_DATABASE: ludo_arena
      MYSQL_ROOT_PASSWORD: root_secure_pass
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql

  ludo-app:
    image: ludo-arena-app:latest
    container_name: ludo_backend
    restart: always
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://db:3306/ludo_arena?useSSL=false&allowPublicKeyRetrieval=true
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root_secure_pass
      - JWT_SECRET=3c990924b89b43e800c4369e88a099a181e18bbd0032e542cfb8079dfa99aa2a
    depends_on:
      - db

volumes:
  db_data:
`
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-2xl max-w-5xl w-full mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code className="w-6 h-6 text-purple-400" />
            Backend & Database Blueprints
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Enterprise architectures, database scripts, and code templates for production deployment.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-purple-950 text-purple-300 rounded-full border border-purple-800/50">
          STABLE RELEASE V1.0.0
        </span>
      </div>

      {/* Sub tabs Menu */}
      <div className="flex border-b border-slate-800 mb-6 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveSubTab('mysql')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'mysql'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          MySQL Schema
        </button>

        <button
          onClick={() => setActiveSubTab('spring')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'spring'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          Spring Boot Controllers
        </button>

        <button
          onClick={() => setActiveSubTab('websocket')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'websocket'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          WS Message Broker
        </button>

        <button
          onClick={() => setActiveSubTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'ai'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI Logic Engine
        </button>

        <button
          onClick={() => setActiveSubTab('deployment')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeSubTab === 'deployment'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Docker & Deploy
        </button>
      </div>

      {/* Code Display Area */}
      <div className="relative">
        <button
          onClick={() => handleCopy(codeSnippets[activeSubTab], activeSubTab)}
          className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2 rounded-xl text-xs flex items-center gap-1.5 transition-all z-10"
        >
          {copiedId === activeSubTab ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Code
            </>
          )}
        </button>

        <pre className="p-5 bg-slate-950 text-slate-300 font-mono text-xs overflow-auto rounded-2xl max-h-[450px] border border-slate-800/80 leading-relaxed shadow-inner">
          <code>{codeSnippets[activeSubTab]}</code>
        </pre>
      </div>
    </div>
  );
}
