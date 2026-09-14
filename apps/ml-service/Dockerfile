FROM python:3.10-slim

WORKDIR /app

COPY apps/ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/ml-service/app ./app
COPY apps/ml-service/scripts ./scripts

EXPOSE 8000
CMD ["python", "app/main.py"]
