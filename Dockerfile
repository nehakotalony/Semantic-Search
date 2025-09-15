# Use official Python 3.10 slim image
FROM python:3.10-slim
 
# Set working directory
WORKDIR /app
 
# Copy requirements first (for caching)
COPY requirements.txt .
 
# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
 
# Copy everything else
COPY . .
 
# Expose port (Flask uses 5000 by default, but Cloud Run expects 8080)
EXPOSE 8080
 
# Run the app with Gunicorn (production-ready server)
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "4", "--timeout", "0", "app:app"]
 