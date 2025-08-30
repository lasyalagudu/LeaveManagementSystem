# Deployment Guide - Leave Management System

This guide provides step-by-step instructions for deploying the Leave Management System in both development and production environments.

## 🚀 Quick Start (Development)

### 1. Prerequisites

- Python 3.8 or higher
- PostgreSQL 12 or higher
- Git

### 2. Clone and Setup

```bash
git clone <repository-url>
cd lms
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
# At minimum, update:
# - DATABASE_URL
# - SECRET_KEY
# - SMTP settings
# - Super Admin credentials
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb lms_db

# Initialize database and seed data
python init_db.py
```

### 5. Run the Application

```bash
# Option 1: Using the startup script
python run.py

# Option 2: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Option 3: Using the main module
python -m app.main
```

### 6. Access the Application

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Root Endpoint**: http://localhost:8000/

## 🏭 Production Deployment

### 1. Environment Setup

```bash
# Set production environment
export ENVIRONMENT=production
export DEBUG=false

# Use strong, unique secret key
export SECRET_KEY="your-super-secure-secret-key-here"
```

### 2. Database Configuration

```bash
# Production PostgreSQL with proper security
# - Use dedicated database user
# - Enable SSL connections
# - Set up proper backups
# - Configure connection pooling

export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

### 3. Email Configuration

```bash
# Production SMTP or email service
export SMTP_HOST="smtp.yourcompany.com"
export SMTP_PORT=587
export SMTP_USERNAME="noreply@yourcompany.com"
export SMTP_PASSWORD="secure-password"
```

### 4. Security Considerations

```bash
# HTTPS only in production
export HTTPS_ONLY=true

# Configure CORS properly
export CORS_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"

# Set trusted hosts
export TRUSTED_HOSTS="yourdomain.com,app.yourdomain.com"
```

### 5. Process Management

```bash
# Using systemd (Linux)
sudo systemctl enable lms
sudo systemctl start lms
sudo systemctl status lms

# Using supervisor
supervisorctl start lms
supervisorctl status lms
```

### 6. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🐳 Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Docker Compose

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/lms_db
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=lms_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. Deploy with Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## 📊 Monitoring and Logging

### 1. Application Logs

```bash
# View application logs
tail -f /var/log/lms/app.log

# Log rotation configuration
logrotate /etc/logrotate.d/lms
```

### 2. Health Monitoring

```bash
# Health check endpoint
curl http://localhost:8000/health

# Database connection check
python -c "from app.database import get_db; next(get_db()).execute('SELECT 1')"
```

### 3. Performance Monitoring

```bash
# Monitor resource usage
htop
iotop
nethogs

# Database performance
pg_stat_statements
pg_stat_activity
```

## 🔒 Security Checklist

- [ ] Strong, unique SECRET_KEY
- [ ] HTTPS enabled
- [ ] Database SSL connections
- [ ] Proper CORS configuration
- [ ] Trusted hosts configured
- [ ] Environment variables secured
- [ ] Database user permissions limited
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Access logging enabled

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall settings

2. **Email Not Sending**

   - Verify SMTP credentials
   - Check port accessibility
   - Review email service logs

3. **Permission Denied**

   - Check file permissions
   - Verify user/group ownership
   - Review SELinux/AppArmor settings

4. **Port Already in Use**
   - Check if another service is using port 8000
   - Use different port: `uvicorn app.main:app --port 8001`

### Debug Mode

```bash
# Enable debug mode for troubleshooting
export DEBUG=true
export LOG_LEVEL=DEBUG

# Run with verbose logging
uvicorn app.main:app --log-level debug
```

## 📞 Support

For deployment issues:

1. Check the logs: `docker-compose logs app` or system logs
2. Verify environment variables
3. Test database connectivity
4. Review security group/firewall rules
5. Check system resources (CPU, memory, disk)

## 🔄 Updates and Maintenance

### 1. Application Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### 2. Database Migrations

```bash
# Run migrations (if using Alembic)
alembic upgrade head

# Backup before major changes
pg_dump lms_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Regular Maintenance

- Monitor disk space
- Review log files
- Update dependencies
- Backup database
- Check security updates

---

**Remember**: Always test deployments in a staging environment before going to production!





