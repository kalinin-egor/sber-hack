FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

RUN mkdir /src

WORKDIR /src

COPY requirements.txt /src/requirements.txt

RUN pip install --no-cache-dir -r /src/requirements.txt

COPY . .

EXPOSE 8075

CMD ["python", "src/main.py"]