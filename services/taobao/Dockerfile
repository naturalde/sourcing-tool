FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Make start script executable
RUN chmod +x start.sh

EXPOSE 8000

# Use start script to handle PORT variable
CMD ["./start.sh"]
