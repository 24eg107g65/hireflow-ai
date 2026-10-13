# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and pom first (layer cache for dependencies)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source and build (skip tests — Render has no DB at build time)
COPY src ./src
RUN ./mvnw package -DskipTests -B

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup -S hireflow && adduser -S hireflow -G hireflow

# Copy the fat JAR from builder
COPY --from=builder /app/target/*.jar app.jar

# Create uploads directory (for resume files)
RUN mkdir -p /app/uploads && chown -R hireflow:hireflow /app

USER hireflow

EXPOSE 8080

# JVM flags optimized for container environments (Render free tier = 512 MB)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
