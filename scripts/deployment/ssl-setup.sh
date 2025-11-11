#!/bin/bash

# SSL Setup Script using Let's Encrypt (Certbot)
# This script helps you setup SSL certificates for your domain

set -e

echo "🔒 SSL Certificate Setup with Let's Encrypt"
echo "==========================================="
echo ""

# Check if domain is provided
if [ -z "$1" ]; then
    echo "❌ Usage: ./ssl-setup.sh <your-domain.com> <email@example.com>"
    echo "Example: ./ssl-setup.sh api.proofpass.com admin@proofpass.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@$DOMAIN}

echo "📍 Domain: $DOMAIN"
echo "📧 Email: $EMAIL"
echo ""

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."

    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y certbot
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install certbot
    else
        echo "❌ Please install certbot manually: https://certbot.eff.org/"
        exit 1
    fi
fi

echo "✅ Certbot found"
echo ""

# Stop nginx temporarily
echo "⏸️  Stopping nginx..."
docker-compose -f docker-compose.prod.yml stop nginx

# Obtain certificate
echo "📜 Obtaining SSL certificate..."
sudo certbot certonly --standalone \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --preferred-challenges http

if [ $? -eq 0 ]; then
    echo "✅ Certificate obtained successfully!"

    # Copy certificates to nginx directory
    echo "📋 Copying certificates..."
    sudo mkdir -p ./nginx/ssl
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./nginx/ssl/
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./nginx/ssl/
    sudo chmod 644 ./nginx/ssl/*.pem

    # Update nginx configuration
    echo "⚙️  Updating nginx configuration..."
    sed -i.bak "s/server_name _;/server_name $DOMAIN;/" ./nginx/nginx.conf
    sed -i.bak "s/# ssl_certificate/ssl_certificate/" ./nginx/nginx.conf
    sed -i.bak "s/# ssl_certificate_key/ssl_certificate_key/" ./nginx/nginx.conf

    # Restart nginx
    echo "🔄 Restarting nginx..."
    docker-compose -f docker-compose.prod.yml start nginx

    echo ""
    echo "═══════════════════════════════════════"
    echo "✨ SSL Setup Complete!"
    echo "═══════════════════════════════════════"
    echo ""
    echo "🔒 Your API is now accessible at: https://$DOMAIN"
    echo ""
    echo "📝 Certificate auto-renewal:"
    echo "Add to crontab: 0 0 * * * /usr/bin/certbot renew --quiet"
    echo ""
else
    echo "❌ Failed to obtain certificate"
    docker-compose -f docker-compose.prod.yml start nginx
    exit 1
fi
