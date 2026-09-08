# ==============================================================================
# CineMind Backend - Multi-Stage Dockerfile (Java 21 / Spring Boot 3.3)
# ==============================================================================

# Stage 1: Build
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Maven network resilience flags (auto-retry up to 5 times on connection drops)
ENV MAVEN_OPTS="-Dmaven.wagon.http.retryHandler.count=5 -Dmaven.wagon.http.connectionTimeout=60000 -Dmaven.wagon.http.readTimeout=60000"

COPY pom.xml .
COPY src ./src

# Build production JAR (using BuildKit cache mount to avoid re-downloading jars on network drops)
RUN --mount=type=cache,target=/root/.m2 mvn package -DskipTests -B

# Stage 2: Minimal Production Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Security: Non-root user
RUN addgroup -S cinemind && adduser -S cinemind -G cinemind
USER cinemind

# Copy executable jar from builder stage
COPY --from=builder /build/target/app.jar app.jar

EXPOSE 8080

# Production container JVM parameters (optimized for 512MB free tier containers)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Xss256k", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
