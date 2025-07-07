# Use the official Nginx image from Docker Hub
FROM nginx:alpine

# Copy the static content (HTML, CSS, JS) from the frontend directory
# to the default Nginx public directory
COPY . /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80
