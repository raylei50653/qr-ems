# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy dependencies
COPY pyproject.toml uv.lock* /app/

# Install dependencies using uv
# --frozen ensures we stick to the lockfile
RUN uv sync --frozen

# Add virtual environment to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy project
COPY . /app/

# Expose port
EXPOSE 8000

# Default command
# Debug: check python and list packages
CMD ["sh", "-c", "echo 'Python location:' && which python && python --version && echo 'Installed packages:' && uv pip list && python manage.py runserver 0.0.0.0:8000"]
