FROM python:3.11.9-slim

WORKDIR /app

COPY requirements.txt requirements.txt
RUN  pip3 install -r requirements.txt

COPY . .

# Create data directory for database
RUN mkdir -p /app/data

CMD [ "python", "main.py" ]