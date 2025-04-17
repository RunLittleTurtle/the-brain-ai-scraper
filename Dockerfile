FROM node:20

WORKDIR /app

# Copy everything into the container
COPY . .

# Optional: expose port if you want to test later
EXPOSE 3000

# Dummy command (do nothing for now)
CMD ["sleep", "infinity"]
