FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download VAD and local inference models for instant container warm-up
RUN python -m livekit.agents download-files

# Copy application source code
COPY src/ ./src/

ENV PYTHONUNBUFFERED=1

# Run agent in production worker mode
CMD ["python", "src/agent.py", "start"]
