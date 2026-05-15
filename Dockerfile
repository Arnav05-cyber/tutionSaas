# ──────────────────────────────────────────────────────────
#  Stage 1 — Build the Spring Boot fat JAR
# ──────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Cache dependencies first (layer caching)
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw mvnw
RUN mvn dependency:go-offline -B

# Copy sources and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# ──────────────────────────────────────────────────────────
#  Stage 2 — Lightweight runtime image
# ──────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="arnav" \
      app="tutionSaas-backend"

WORKDIR /app

# Create uploads directory for local file storage
RUN mkdir -p /app/uploads

# Copy the fat JAR from builder
COPY --from=builder /build/target/*.jar app.jar

# Expose the default Spring Boot port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run with the docker profile
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=docker", \
  "-jar", "app.jar"]
