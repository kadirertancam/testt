FROM nginx:alpine

# Nginx config for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website files
COPY index.html /usr/share/nginx/html/

# Expose ports
EXPOSE 80 443

# Disable default healthcheck
HEALTHCHECK NONE

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
