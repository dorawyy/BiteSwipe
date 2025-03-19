FROM nginx:latest

# Install OpenSSL for certificate generation
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set up directories for SSL certificates
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

# Copy custom entrypoint script
COPY ./nginx-entrypoint.sh /nginx-entrypoint-inside-container.sh
RUN chmod +x /nginx-entrypoint-inside-container.sh

# Set the entrypoint
ENTRYPOINT ["/nginx-entrypoint-inside-container.sh"]

# Default command
CMD ["nginx", "-g", "daemon off;"]
