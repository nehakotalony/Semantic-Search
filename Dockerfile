# Use official Python 3.10 slim image from Google's container registry
FROM gcr.io/deeplearning-platform-release/base-cpu:latest
 
# Set working directory
WORKDIR /app
 
# Copy requirements first (for caching)
COPY requirements.txt .
 
# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
 
# Copy everything else
COPY . .
 
# Expose port 8080 (required by Cloud Run)
EXPOSE 8080
 
# Run the app with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "4", "--timeout", "0", "app:app"]