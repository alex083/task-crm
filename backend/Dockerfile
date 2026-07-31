FROM python:3.10-slim

WORKDIR /app

# Встановлюємо системні залежності для PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Встановлюємо Python-бібліотеки
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо решту код бекенду
COPY . .