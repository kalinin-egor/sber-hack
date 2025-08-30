FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

RUN mkdir /src

WORKDIR /src

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libportaudio2 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /src/requirements.txt

RUN pip install --no-cache-dir -r /src/requirements.txt

COPY . .

EXPOSE 8075

# Увеличиваем лимиты для обработки больших файлов
ENV PYTHONPATH=/src
ENV MAX_WORKERS=4
ENV WORKER_CLASS=uvicorn.workers.UvicornWorker

CMD ["python", "src/main.py"]