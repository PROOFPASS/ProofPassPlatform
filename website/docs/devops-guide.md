# Guía DevOps - ProofPass Platform

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Requisitos de Infraestructura](#requisitos-de-infraestructura)
4. [Configuración Inicial](#configuración-inicial)
5. [Despliegue en Producción](#despliegue-en-producción)
6. [Configuración de Servicios](#configuración-de-servicios)
7. [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)
8. [Backups y Recuperación](#backups-y-recuperación)
9. [Seguridad](#seguridad)
10. [Operaciones del Día a Día](#operaciones-del-día-a-día)
11. [Troubleshooting](#troubleshooting)
12. [Escalamiento](#escalamiento)

---

## Introducción

ProofPass Platform es una plataforma de emisión y verificación de credenciales verificables (VCs) construida sobre Stellar blockchain. Esta guía proporciona instrucciones completas para desplegar y operar la plataforma en un entorno de producción.

### Componentes Principales

- **API Backend**: Servicio Node.js/Express que maneja emisión de credenciales y lógica de negocio
- **Platform Frontend**: Aplicación Next.js para interfaz de usuario
- **Base de Datos PostgreSQL**: Almacenamiento de datos relacionales
- **Stellar Network**: Blockchain para anclaje de credenciales
- **OpenBao**: Gestión de secretos y claves criptográficas
- **Nginx**: Proxy reverso y balanceador de carga

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer (Nginx)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴──────────────┐
        │                              │
┌───────▼────────┐            ┌────────▼───────┐
│   Platform     │            │   API Backend  │
│   (Next.js)    │            │   (Node.js)    │
│   Port: 3000   │            │   Port: 4000   │
└────────────────┘            └────────┬───────┘
                                       │
                        ┌──────────────┼──────────────┐
                        │              │              │
                ┌───────▼─────┐  ┌────▼─────┐  ┌────▼──────┐
                │ PostgreSQL  │  │ OpenBao  │  │  Stellar  │
                │  Port: 5432 │  │ Port:8200│  │  Network  │
                └─────────────┘  └──────────┘  └───────────┘
```

### Flujo de Datos

1. Usuario accede a Platform (Next.js) vía navegador
2. Platform se comunica con API Backend para operaciones
3. API Backend:
   - Consulta/actualiza PostgreSQL para datos persistentes
   - Obtiene secretos de OpenBao
   - Interactúa con Stellar para operaciones blockchain
4. Las respuestas fluyen de vuelta al usuario

---

## Requisitos de Infraestructura

### Hardware Mínimo (Producción Pequeña)

**Servidor de Aplicación:**
- CPU: 4 cores
- RAM: 8 GB
- Disco: 100 GB SSD
- Red: 100 Mbps

**Servidor de Base de Datos:**
- CPU: 4 cores
- RAM: 16 GB
- Disco: 500 GB SSD (con capacidad de expansión)
- Red: 100 Mbps

### Hardware Recomendado (Producción Media-Alta)

**Cluster de Aplicaciones (2-3 nodos):**
- CPU: 8 cores por nodo
- RAM: 16 GB por nodo
- Disco: 200 GB SSD por nodo
- Red: 1 Gbps

**Cluster de Base de Datos (Primary + Replica):**
- CPU: 8 cores
- RAM: 32 GB
- Disco: 1 TB SSD NVMe
- Red: 1 Gbps

### Software Base

- Sistema Operativo: Ubuntu 22.04 LTS o superior
- Docker: 24.x o superior
- Docker Compose: 2.x o superior
- Node.js: 18.x LTS
- PostgreSQL: 15.x
- Nginx: 1.24.x
- Certificados SSL/TLS válidos

---

## Configuración Inicial

### 1. Preparación del Servidor

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias base
sudo apt install -y \
  curl \
  git \
  build-essential \
  nginx \
  postgresql-client \
  certbot \
  python3-certbot-nginx

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalaciones
docker --version
docker-compose --version
node --version
npm --version
```

### 2. Configuración de Firewall

```bash
# Configurar UFW (Uncomplicated Firewall)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir PostgreSQL (solo desde red interna si aplica)
sudo ufw allow from <RED_INTERNA> to any port 5432

# Activar firewall
sudo ufw enable
sudo ufw status verbose
```

### 3. Crear Usuario de Aplicación

```bash
# Crear usuario sin privilegios para ejecutar la aplicación
sudo useradd -r -m -s /bin/bash proofpass
sudo usermod -aG docker proofpass

# Crear directorios de aplicación
sudo mkdir -p /opt/proofpass
sudo chown proofpass:proofpass /opt/proofpass
```

---

## Despliegue en Producción

### 1. Clonar el Repositorio

```bash
# Cambiar a usuario proofpass
sudo su - proofpass

# Clonar repositorio
cd /opt/proofpass
git clone <REPOSITORY_URL> platform
cd platform

# Verificar la rama correcta
git checkout main
```

### 2. Configurar Variables de Entorno

```bash
# Crear archivo .env en el directorio raíz
cat > /opt/proofpass/platform/.env << 'EOF'
# ======================
# CONFIGURACIÓN GENERAL
# ======================
NODE_ENV=production
LOG_LEVEL=info

# ======================
# API BACKEND
# ======================
API_PORT=4000
API_HOST=0.0.0.0
API_URL=https://api.tudominio.com

# ======================
# PLATFORM FRONTEND
# ======================
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXTAUTH_URL=https://platform.tudominio.com
NEXTAUTH_SECRET=<GENERAR_SECRET_SEGURO>

# ======================
# BASE DE DATOS
# ======================
DATABASE_URL=postgresql://proofpass_user:PASSWORD_SEGURO@localhost:5432/proofpass_prod
POSTGRES_USER=proofpass_user
POSTGRES_PASSWORD=PASSWORD_SEGURO
POSTGRES_DB=proofpass_prod

# ======================
# STELLAR BLOCKCHAIN
# ======================
STELLAR_NETWORK=PUBLIC  # o TESTNET para pruebas
STELLAR_HORIZON_URL=https://horizon.stellar.org
STELLAR_ISSUER_SECRET=<SECRET_KEY_STELLAR>
STELLAR_DISTRIBUTION_SECRET=<SECRET_KEY_STELLAR>

# ======================
# OPENBAO
# ======================
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=<TOKEN_GENERADO_EN_INIT>
VAULT_NAMESPACE=proofpass

# ======================
# SEGURIDAD
# ======================
JWT_SECRET=<GENERAR_SECRET_SEGURO_64_CHARS>
ENCRYPTION_KEY=<GENERAR_KEY_32_BYTES_HEX>
CORS_ORIGIN=https://platform.tudominio.com

# ======================
# OBSERVABILIDAD
# ======================
ENABLE_METRICS=true
METRICS_PORT=9090
PROMETHEUS_URL=http://localhost:9091
GRAFANA_URL=http://localhost:3001

# ======================
# RATE LIMITING
# ======================
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# ======================
# EMAIL (opcional)
# ======================
SMTP_HOST=smtp.tuproveedor.com
SMTP_PORT=587
SMTP_USER=noreply@tudominio.com
SMTP_PASSWORD=<SMTP_PASSWORD>
SMTP_FROM=noreply@tudominio.com
EOF

# Asegurar permisos restrictivos
chmod 600 /opt/proofpass/platform/.env
```

**IMPORTANTE**: Genera secretos seguros usando:
```bash
# Para NEXTAUTH_SECRET y JWT_SECRET
openssl rand -hex 32

# Para ENCRYPTION_KEY
openssl rand -hex 16
```

### 3. Instalar Dependencias

```bash
cd /opt/proofpass/platform

# Instalar dependencias usando --legacy-peer-deps debido a React 19
npm install --legacy-peer-deps --production

# Compilar paquetes TypeScript
npm run build:packages

# Compilar aplicaciones
npm run build
```

### 4. Configurar Base de Datos

```bash
# Crear base de datos y usuario
sudo -u postgres psql << EOF
CREATE DATABASE proofpass_prod;
CREATE USER proofpass_user WITH ENCRYPTED PASSWORD 'PASSWORD_SEGURO';
GRANT ALL PRIVILEGES ON DATABASE proofpass_prod TO proofpass_user;
\c proofpass_prod
GRANT ALL ON SCHEMA public TO proofpass_user;
EOF

# Ejecutar migraciones
cd /opt/proofpass/platform/apps/api
node ../../scripts/run-migration.js

# Verificar que las tablas se crearon
sudo -u postgres psql proofpass_prod -c "\dt"
```

### 5. Inicializar OpenBao

```bash
# Iniciar OpenBao en un contenedor Docker
docker run -d \
  --name openbao \
  --restart=always \
  -p 8200:8200 \
  -v /opt/proofpass/openbao/data:/vault/data \
  -v /opt/proofpass/openbao/config:/vault/config \
  -e 'VAULT_LOCAL_CONFIG={"storage": {"file": {"path": "/vault/data"}}, "listener": [{"tcp": { "address": "0.0.0.0:8200", "tls_disable": true}}], "default_lease_ttl": "168h", "max_lease_ttl": "720h", "ui": true}' \
  openbao/openbao:latest server

# Esperar a que inicie
sleep 5

# Inicializar Vault
docker exec openbao vault operator init -key-shares=5 -key-threshold=3

# GUARDAR LAS CLAVES DE UNSEAL Y ROOT TOKEN EN UN LUGAR SEGURO
# El comando anterior mostrará:
# - 5 Unseal Keys (guardar en lugares separados y seguros)
# - Initial Root Token (guardar de forma segura)

# Desbloquear Vault (usar 3 de las 5 claves)
docker exec openbao vault operator unseal <KEY_1>
docker exec openbao vault operator unseal <KEY_2>
docker exec openbao vault operator unseal <KEY_3>

# Configurar secrets engine
docker exec -e VAULT_TOKEN=<ROOT_TOKEN> openbao vault secrets enable -path=proofpass kv-v2

# Almacenar secretos de Stellar
docker exec -e VAULT_TOKEN=<ROOT_TOKEN> openbao vault kv put proofpass/stellar \
  issuer_secret=<STELLAR_ISSUER_SECRET> \
  distribution_secret=<STELLAR_DISTRIBUTION_SECRET>
```

### 6. Configurar Nginx

```bash
# Crear configuración de Nginx
sudo cat > /etc/nginx/sites-available/proofpass << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=platform_limit:10m rate=30r/s;

# API Backend
upstream api_backend {
    least_conn;
    server 127.0.0.1:4000 max_fails=3 fail_timeout=30s;
    # Agregar más servidores para HA:
    # server 127.0.0.1:4001 max_fails=3 fail_timeout=30s;
    # server 127.0.0.1:4002 max_fails=3 fail_timeout=30s;
}

# Platform Frontend
upstream platform_frontend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    # Agregar más servidores para HA:
    # server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.tudominio.com platform.tudominio.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# API Backend HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.tudominio.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/api.access.log;
    error_log /var/log/nginx/api.error.log;

    # Rate Limiting
    limit_req zone=api_limit burst=20 nodelay;

    # Proxy Settings
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://api_backend/health;
        access_log off;
    }
}

# Platform Frontend HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name platform.tudominio.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/platform.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/platform.tudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/platform.access.log;
    error_log /var/log/nginx/platform.error.log;

    # Rate Limiting
    limit_req zone=platform_limit burst=50 nodelay;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Proxy Settings
    location / {
        proxy_pass http://platform_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://platform_frontend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://platform_frontend/health;
        access_log off;
    }
}
EOF

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/proofpass /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Obtener certificados SSL
sudo certbot --nginx -d api.tudominio.com -d platform.tudominio.com

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 7. Crear Servicios Systemd

**API Backend Service:**

```bash
sudo cat > /etc/systemd/system/proofpass-api.service << 'EOF'
[Unit]
Description=ProofPass API Backend
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=proofpass
WorkingDirectory=/opt/proofpass/platform/apps/api
Environment=NODE_ENV=production
EnvironmentFile=/opt/proofpass/platform/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=proofpass-api

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/proofpass/platform

# Resource Limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF
```

**Platform Frontend Service:**

```bash
sudo cat > /etc/systemd/system/proofpass-platform.service << 'EOF'
[Unit]
Description=ProofPass Platform Frontend
After=network.target
Requires=proofpass-api.service

[Service]
Type=simple
User=proofpass
WorkingDirectory=/opt/proofpass/platform/apps/platform
Environment=NODE_ENV=production
EnvironmentFile=/opt/proofpass/platform/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=proofpass-platform

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/proofpass/platform

# Resource Limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF
```

**Habilitar y arrancar servicios:**

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar servicios para inicio automático
sudo systemctl enable proofpass-api
sudo systemctl enable proofpass-platform

# Iniciar servicios
sudo systemctl start proofpass-api
sudo systemctl start proofpass-platform

# Verificar estado
sudo systemctl status proofpass-api
sudo systemctl status proofpass-platform

# Ver logs en tiempo real
sudo journalctl -u proofpass-api -f
sudo journalctl -u proofpass-platform -f
```

---

## Configuración de Servicios

### PostgreSQL Optimización

```bash
# Editar configuración de PostgreSQL
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Configuraciones recomendadas para producción:

```ini
# Connections
max_connections = 200
shared_buffers = 4GB  # 25% de RAM total
effective_cache_size = 12GB  # 75% de RAM total
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1  # Para SSD
effective_io_concurrency = 200  # Para SSD
work_mem = 20MB
min_wal_size = 1GB
max_wal_size = 4GB

# Logging
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0

# Replication (si aplica)
wal_level = replica
max_wal_senders = 3
wal_keep_size = 16
```

Reiniciar PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Configurar Backups Automáticos de PostgreSQL

```bash
# Crear script de backup
sudo cat > /opt/proofpass/scripts/backup-db.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/opt/proofpass/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Realizar backup
pg_dump -U proofpass_user -h localhost proofpass_prod | gzip > $BACKUP_DIR/proofpass_$DATE.sql.gz

# Eliminar backups antiguos
find $BACKUP_DIR -name "proofpass_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "$(date): Backup completado: proofpass_$DATE.sql.gz"
EOF

# Hacer ejecutable
sudo chmod +x /opt/proofpass/scripts/backup-db.sh

# Configurar cron para ejecutar diariamente a las 2 AM
sudo crontab -e
# Agregar:
# 0 2 * * * /opt/proofpass/scripts/backup-db.sh >> /var/log/proofpass-backup.log 2>&1
```

---

## Monitoreo y Observabilidad

### 1. Configurar Prometheus

```bash
# Crear docker-compose para stack de monitoreo
cat > /opt/proofpass/observability/docker-compose.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: always
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus/config:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: always
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=<CAMBIAR_PASSWORD>
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus

  node_exporter:
    image: prom/node-exporter:latest
    container_name: node_exporter
    restart: always
    ports:
      - "9100:9100"
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro

  postgres_exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres_exporter
    restart: always
    ports:
      - "9187:9187"
    environment:
      DATA_SOURCE_NAME: "postgresql://proofpass_user:PASSWORD_SEGURO@host.docker.internal:5432/proofpass_prod?sslmode=disable"

volumes:
  prometheus_data:
  grafana_data:
EOF

# Crear configuración de Prometheus
mkdir -p /opt/proofpass/observability/prometheus/config
cat > /opt/proofpass/observability/prometheus/config/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'proofpass-prod'
    environment: 'production'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node_exporter'
    static_configs:
      - targets: ['node_exporter:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres_exporter:9187']

  - job_name: 'api_backend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['host.docker.internal:9090']
        labels:
          service: 'api'

  - job_name: 'platform_frontend'
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['host.docker.internal:3000']
        labels:
          service: 'platform'
EOF

# Iniciar stack de monitoreo
cd /opt/proofpass/observability
docker-compose up -d

# Verificar que están corriendo
docker-compose ps
```

### 2. Configurar Dashboards de Grafana

Acceder a Grafana en `http://servidor:3001` y:

1. Login con `admin/<PASSWORD>`
2. Agregar Prometheus como data source:
   - URL: `http://prometheus:9090`
   - Access: Server (default)
3. Importar dashboards recomendados:
   - Node Exporter Full (ID: 1860)
   - PostgreSQL Database (ID: 9628)
   - Custom dashboard para API y Platform

### 3. Configurar Alertas

Crear archivo de reglas de alertas:

```bash
cat > /opt/proofpass/observability/prometheus/config/alerts.yml << 'EOF'
groups:
  - name: proofpass_alerts
    interval: 30s
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for 5 minutes"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 85%"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 15
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Disk space is below 15%"

      - alert: ServiceDown
        expr: up{job=~"api_backend|platform_frontend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.job }} is down"

      - alert: PostgreSQLDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down"
          description: "PostgreSQL database is not responding"

      - alert: HighDatabaseConnections
        expr: sum(pg_stat_database_numbackends{datname="proofpass_prod"}) > 150
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of database connections"
          description: "Database has more than 150 active connections"
EOF

# Actualizar prometheus.yml para incluir las alertas
cat >> /opt/proofpass/observability/prometheus/config/prometheus.yml << 'EOF'

rule_files:
  - 'alerts.yml'
EOF

# Reiniciar Prometheus
cd /opt/proofpass/observability
docker-compose restart prometheus
```

---

## Backups y Recuperación

### Estrategia de Backup

**1. Backups de Base de Datos:**
- Frecuencia: Diaria (completo), cada 6 horas (incremental)
- Retención: 30 días locales, 90 días en almacenamiento remoto
- Ubicación: `/opt/proofpass/backups/postgres/`

**2. Backups de Configuración:**
- Frecuencia: Después de cada cambio
- Incluye: `.env`, configuraciones de Nginx, configuraciones de servicios
- Ubicación: `/opt/proofpass/backups/config/`

**3. Backups de OpenBao:**
- Frecuencia: Semanal
- Incluye: Snapshot del backend storage
- Ubicación: `/opt/proofpass/backups/vault/`

### Script de Backup Completo

```bash
cat > /opt/proofpass/scripts/backup-all.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_BASE="/opt/proofpass/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/proofpass-backup.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "=== Iniciando backup completo ==="

# 1. Backup de PostgreSQL
log "Backup de PostgreSQL..."
pg_dump -U proofpass_user -h localhost proofpass_prod | gzip > $BACKUP_BASE/postgres/proofpass_$DATE.sql.gz
log "PostgreSQL backup completado"

# 2. Backup de configuraciones
log "Backup de configuraciones..."
mkdir -p $BACKUP_BASE/config/$DATE
cp /opt/proofpass/platform/.env $BACKUP_BASE/config/$DATE/
cp /etc/nginx/sites-available/proofpass $BACKUP_BASE/config/$DATE/nginx.conf
cp /etc/systemd/system/proofpass-*.service $BACKUP_BASE/config/$DATE/
log "Configuraciones backed up"

# 3. Backup de OpenBao (si está configurado)
log "Backup de OpenBao..."
if [ -d "/opt/proofpass/openbao/data" ]; then
    tar -czf $BACKUP_BASE/vault/vault_$DATE.tar.gz -C /opt/proofpass/openbao data/
    log "OpenBao backup completado"
fi

# 4. Sincronizar a almacenamiento remoto (S3, etc)
# Descomentar y configurar según tu proveedor
# aws s3 sync $BACKUP_BASE s3://tu-bucket/proofpass-backups/

# 5. Limpiar backups antiguos (retener 30 días)
find $BACKUP_BASE/postgres -name "proofpass_*.sql.gz" -mtime +30 -delete
find $BACKUP_BASE/config -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true
find $BACKUP_BASE/vault -name "vault_*.tar.gz" -mtime +90 -delete

log "=== Backup completo finalizado ==="
EOF

chmod +x /opt/proofpass/scripts/backup-all.sh

# Configurar cron
sudo crontab -e
# Agregar:
# 0 2 * * * /opt/proofpass/scripts/backup-all.sh
# 0 */6 * * * /opt/proofpass/scripts/backup-db.sh >> /var/log/proofpass-backup.log 2>&1
```

### Procedimiento de Recuperación

**Recuperar Base de Datos:**

```bash
# 1. Detener servicios
sudo systemctl stop proofpass-api proofpass-platform

# 2. Restaurar backup
gunzip -c /opt/proofpass/backups/postgres/proofpass_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U proofpass_user -h localhost -d proofpass_prod

# 3. Verificar integridad
psql -U proofpass_user -h localhost -d proofpass_prod -c "SELECT COUNT(*) FROM users;"

# 4. Reiniciar servicios
sudo systemctl start proofpass-api proofpass-platform
```

**Recuperación Completa del Sistema:**

```bash
# 1. Instalar sistema base (ver sección "Configuración Inicial")

# 2. Restaurar configuraciones
cp /opt/proofpass/backups/config/YYYYMMDD_HHMMSS/.env /opt/proofpass/platform/
cp /opt/proofpass/backups/config/YYYYMMDD_HHMMSS/nginx.conf /etc/nginx/sites-available/proofpass

# 3. Restaurar base de datos (ver arriba)

# 4. Restaurar OpenBao
tar -xzf /opt/proofpass/backups/vault/vault_YYYYMMDD_HHMMSS.tar.gz -C /opt/proofpass/openbao/

# 5. Reiniciar todos los servicios
sudo systemctl start proofpass-api proofpass-platform
sudo systemctl restart nginx
docker restart openbao
```

---

## Seguridad

### 1. Hardening del Sistema

```bash
# Deshabilitar login root via SSH
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Configurar fail2ban
sudo apt install fail2ban -y
sudo cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
logpath = /var/log/nginx/*error.log
maxretry = 10
findtime = 60
bantime = 7200
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configurar auditoría
sudo apt install auditd -y
sudo systemctl enable auditd
sudo systemctl start auditd
```

### 2. Rotación de Secretos

```bash
# Script para rotar JWT_SECRET
cat > /opt/proofpass/scripts/rotate-jwt.sh << 'EOF'
#!/bin/bash
set -e

# Generar nuevo secret
NEW_SECRET=$(openssl rand -hex 32)

# Actualizar .env
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" /opt/proofpass/platform/.env

# Reiniciar servicios
sudo systemctl restart proofpass-api proofpass-platform

echo "JWT_SECRET rotado exitosamente"
EOF

chmod +x /opt/proofpass/scripts/rotate-jwt.sh

# Rotar cada 90 días via cron
# 0 3 1 */3 * /opt/proofpass/scripts/rotate-jwt.sh >> /var/log/secret-rotation.log 2>&1
```

### 3. SSL/TLS Best Practices

```bash
# Generar DH params fuertes
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 4096

# Actualizar configuración de Nginx (ya incluido en la config anterior)
# Verificar rating SSL
# https://www.ssllabs.com/ssltest/
```

### 4. Configurar WAF (ModSecurity)

```bash
# Instalar ModSecurity
sudo apt install libapache2-mod-security2 -y

# Configurar reglas OWASP
cd /opt
sudo git clone https://github.com/coreruleset/coreruleset.git
sudo cp -r coreruleset/rules /etc/nginx/modsec/

# Configurar en Nginx (requiere compilación con módulo ModSecurity)
# Esto es avanzado - considerar usar un WAF cloud como Cloudflare
```

---

## Operaciones del Día a Día

### Monitoreo de Logs

```bash
# Ver logs de API
sudo journalctl -u proofpass-api -f

# Ver logs de Platform
sudo journalctl -u proofpass-platform -f

# Ver logs de Nginx
sudo tail -f /var/log/nginx/api.access.log
sudo tail -f /var/log/nginx/platform.error.log

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Buscar errores en los últimos 60 minutos
sudo journalctl -u proofpass-api --since "60 minutes ago" | grep ERROR
```

### Verificación de Salud

```bash
# Script de health check
cat > /opt/proofpass/scripts/health-check.sh << 'EOF'
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check_service() {
    if systemctl is-active --quiet $1; then
        echo -e "${GREEN}✓${NC} $1 is running"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT running"
        return 1
    fi
}

check_http() {
    if curl -f -s -o /dev/null $1; then
        echo -e "${GREEN}✓${NC} $2 is responding"
        return 0
    else
        echo -e "${RED}✗${NC} $2 is NOT responding"
        return 1
    fi
}

echo "=== ProofPass Health Check ==="
echo ""

# Servicios
check_service proofpass-api
check_service proofpass-platform
check_service nginx
check_service postgresql

echo ""

# HTTP endpoints
check_http "https://api.tudominio.com/health" "API Backend"
check_http "https://platform.tudominio.com/health" "Platform Frontend"

echo ""

# PostgreSQL
if pg_isready -h localhost -p 5432 -U proofpass_user > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL is accepting connections"
else
    echo -e "${RED}✗${NC} PostgreSQL is NOT accepting connections"
fi

# Disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 85 ]; then
    echo -e "${GREEN}✓${NC} Disk usage: ${DISK_USAGE}%"
else
    echo -e "${RED}✗${NC} Disk usage: ${DISK_USAGE}% (WARNING)"
fi

# Memory
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ $MEM_USAGE -lt 90 ]; then
    echo -e "${GREEN}✓${NC} Memory usage: ${MEM_USAGE}%"
else
    echo -e "${RED}✗${NC} Memory usage: ${MEM_USAGE}% (WARNING)"
fi

echo ""
echo "=== Health Check Complete ==="
EOF

chmod +x /opt/proofpass/scripts/health-check.sh

# Ejecutar
/opt/proofpass/scripts/health-check.sh
```

### Actualización de la Aplicación

```bash
# Script de despliegue
cat > /opt/proofpass/scripts/deploy.sh << 'EOF'
#!/bin/bash
set -e

APP_DIR="/opt/proofpass/platform"
BACKUP_DIR="/opt/proofpass/backups/deployments"
DATE=$(date +%Y%m%d_%H%M%S)

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "=== Iniciando despliegue ==="

# 1. Crear backup pre-deploy
log "Creando backup..."
/opt/proofpass/scripts/backup-all.sh

# 2. Detener servicios
log "Deteniendo servicios..."
sudo systemctl stop proofpass-platform
sudo systemctl stop proofpass-api

# 3. Actualizar código
log "Actualizando código..."
cd $APP_DIR
git fetch origin
git checkout main
git pull origin main

# 4. Instalar dependencias
log "Instalando dependencias..."
npm install --legacy-peer-deps --production

# 5. Ejecutar migraciones de BD
log "Ejecutando migraciones..."
cd apps/api
node ../../scripts/run-migration.js
cd ../..

# 6. Compilar aplicación
log "Compilando aplicación..."
npm run build:packages
npm run build

# 7. Reiniciar servicios
log "Reiniciando servicios..."
sudo systemctl start proofpass-api
sleep 10
sudo systemctl start proofpass-platform

# 8. Health check
log "Verificando salud de servicios..."
sleep 15
/opt/proofpass/scripts/health-check.sh

log "=== Despliegue completado ==="
EOF

chmod +x /opt/proofpass/scripts/deploy.sh
```

### Limpieza de Logs

```bash
# Configurar logrotate
sudo cat > /etc/logrotate.d/proofpass << 'EOF'
/var/log/nginx/api.*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}

/var/log/nginx/platform.*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}

/var/log/proofpass-*.log {
    weekly
    rotate 8
    compress
    delaycompress
    notifempty
    create 0640 proofpass proofpass
}
EOF

# Probar configuración
sudo logrotate -f /etc/logrotate.d/proofpass
```

---

## Troubleshooting

### Problema: Servicio API no inicia

**Síntomas:**
```bash
sudo systemctl status proofpass-api
● proofpass-api.service - ProofPass API Backend
   Loaded: loaded
   Active: failed
```

**Diagnóstico:**
```bash
# Ver logs detallados
sudo journalctl -u proofpass-api -n 100 --no-pager

# Verificar archivo .env
cat /opt/proofpass/platform/.env | grep -v PASSWORD

# Verificar permisos
ls -la /opt/proofpass/platform/apps/api

# Probar ejecución manual
sudo su - proofpass
cd /opt/proofpass/platform/apps/api
npm start
```

**Soluciones Comunes:**
1. Variables de entorno faltantes → Verificar .env
2. Puerto ya en uso → `sudo lsof -i :4000`
3. Problemas de conexión a BD → Verificar DATABASE_URL

---

### Problema: Alta latencia en API

**Diagnóstico:**
```bash
# Ver queries lentas en PostgreSQL
sudo -u postgres psql proofpass_prod << EOF
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
EOF

# Ver conexiones activas
sudo -u postgres psql proofpass_prod -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Monitorear recursos
htop
iotop
```

**Soluciones:**
1. Optimizar queries lentas
2. Agregar índices a BD
3. Aumentar pool de conexiones
4. Escalar horizontalmente

---

### Problema: OpenBao sellado

**Síntomas:**
```bash
docker logs openbao
Vault is sealed
```

**Solución:**
```bash
# Desbloquear Vault con 3 de las 5 unseal keys
docker exec openbao vault operator unseal <KEY_1>
docker exec openbao vault operator unseal <KEY_2>
docker exec openbao vault operator unseal <KEY_3>

# Verificar estado
docker exec openbao vault status
```

---

### Problema: Certificados SSL expirados

**Diagnóstico:**
```bash
# Verificar expiración
sudo certbot certificates

# Ver detalles
openssl x509 -in /etc/letsencrypt/live/api.tudominio.com/cert.pem -noout -dates
```

**Solución:**
```bash
# Renovar certificados
sudo certbot renew

# Si falla, renovar forzadamente
sudo certbot renew --force-renewal

# Verificar auto-renovación
sudo systemctl status certbot.timer
```

---

## Escalamiento

### Escalamiento Horizontal (Multi-servidor)

**Arquitectura Recomendada:**

```
                    ┌──────────────┐
                    │ Load Balancer│
                    │   (HAProxy)  │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐    ┌─────▼─────┐   ┌─────▼─────┐
    │  Server 1 │    │  Server 2 │   │  Server 3 │
    │ API + Web │    │ API + Web │   │ API + Web │
    └─────┬─────┘    └─────┬─────┘   └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    │Primary+Replica│
                    └──────────────┘
```

**Configurar HAProxy:**

```bash
# Instalar HAProxy
sudo apt install haproxy -y

# Configurar
sudo cat > /etc/haproxy/haproxy.cfg << 'EOF'
global
    maxconn 4096
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

defaults
    log global
    mode http
    option httplog
    option dontlognull
    timeout connect 5000
    timeout client 50000
    timeout server 50000

frontend api_frontend
    bind *:80
    bind *:443 ssl crt /etc/haproxy/certs/api.pem
    redirect scheme https if !{ ssl_fc }
    default_backend api_backend

backend api_backend
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    server api1 10.0.1.101:4000 check
    server api2 10.0.1.102:4000 check
    server api3 10.0.1.103:4000 check

frontend platform_frontend
    bind *:80
    bind *:443 ssl crt /etc/haproxy/certs/platform.pem
    redirect scheme https if !{ ssl_fc }
    default_backend platform_backend

backend platform_backend
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    server platform1 10.0.1.101:3000 check
    server platform2 10.0.1.102:3000 check
    server platform3 10.0.1.103:3000 check

listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE
EOF

sudo systemctl restart haproxy
```

### Escalamiento Vertical

**Optimizaciones para servidor más grande:**

```bash
# Aumentar límites del sistema
sudo cat >> /etc/security/limits.conf << 'EOF'
*  soft  nofile  65536
*  hard  nofile  65536
*  soft  nproc   32768
*  hard  nproc   32768
EOF

# Optimizar kernel
sudo cat >> /etc/sysctl.conf << 'EOF'
# Network tuning
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 65536
net.core.netdev_max_backlog = 65536
net.ipv4.ip_local_port_range = 1024 65535

# Memory
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 2
EOF

sudo sysctl -p
```

### Auto-scaling con Docker Swarm o Kubernetes

Para alta demanda, considerar migrar a orquestación con contenedores.

---

## Checklist de Producción

Antes de lanzar a producción, verificar:

**Seguridad:**
- [ ] Certificados SSL instalados y válidos
- [ ] Firewall configurado correctamente
- [ ] Fail2ban activo
- [ ] Secretos rotados de valores por defecto
- [ ] OpenBao inicializado y unseal keys guardadas de forma segura
- [ ] Backups de unseal keys en múltiples ubicaciones físicas
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad configurados en Nginx

**Base de Datos:**
- [ ] PostgreSQL optimizado para producción
- [ ] Backups automáticos configurados
- [ ] Procedimiento de recuperación probado
- [ ] Índices optimizados
- [ ] Monitoreo de queries lentas activo

**Servicios:**
- [ ] Todos los servicios systemd habilitados
- [ ] Health checks funcionando
- [ ] Logs rotando correctamente
- [ ] Monitoreo con Prometheus/Grafana activo
- [ ] Alertas configuradas

**Networking:**
- [ ] DNS configurado correctamente
- [ ] Load balancer configurado (si aplica)
- [ ] CDN configurado para assets estáticos (opcional)
- [ ] HTTPS forzado
- [ ] SSL rating A+ en SSLLabs

**Documentación:**
- [ ] Runbook de operaciones completado
- [ ] Contactos de emergencia documentados
- [ ] Procedimientos de escalación definidos
- [ ] Plan de recuperación ante desastres documentado

---

## Contactos y Soporte

**Equipo de DevOps:**
- Email: devops@tudominio.com
- Slack: #proofpass-ops

**Escalación:**
1. L1 Support: support@tudominio.com
2. L2 DevOps: devops@tudominio.com
3. L3 Engineering: engineering@tudominio.com

**Proveedores:**
- Hosting: `<nombre_proveedor>`
- SSL: Let's Encrypt
- Monitoring: Grafana Cloud (opcional)
- Backup Storage: `<S3/GCS/Azure>`

---

## Recursos Adicionales

- [Documentación de API](./API.md)
- [Guía de Desarrollo](./DEVELOPMENT.md)
- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [Stellar Documentation](https://developers.stellar.org/)
- [OpenBao Documentation](https://openbao.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Última actualización:** 2025-11-09
**Versión:** 1.0
**Mantenido por:** DevOps Team
