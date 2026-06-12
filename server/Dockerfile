FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install --omit=dev

COPY server/python_service/ ./python_service/
RUN python -m pip install --no-cache-dir -r python_service/requirements.txt

COPY server/src/ ./src/
RUN mkdir -p uploads

EXPOSE 5000

CMD ["npm", "start"]