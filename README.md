# Running

1. Define the environment variables:

```bash
# Create a .env file
RABBITMQ_URI="amqp://admin:guest@localhost"
CME_BASE_URL="..."
PTAX_BASE_URL="..."
THE_NEWS_BASE_URL="..."
```

2. Create a shared network to establish connection with RabbitMQ at multiple
   microservices

```bash
# See if already have a network called "jim-network"
docker network ls

# If not, create it
docker network create jim-network
```

3. Run the RabbitMQ process

```bash
# At Powershell
docker run -d `
  --name rabbitmq `
  --restart always `
  --network jim-network `
  --memory=500m `
  -p 5672:5672 `
  -p 15672:15672 `
  -e RABBITMQ_DEFAULT_USER=admin `
  -e RABBITMQ_DEFAULT_PASS=guest `
  -v rabbitmq_data:/var/lib/rabbitmq `
  -v "${PWD}\rabbitmq\rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf" `
  rabbitmq:3-management


# Or at Linux system
docker run -d \
  --name rabbitmq \
  --restart always \
  --network jim-network \
  --memory=500m \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=guest \
  -v rabbitmq_data:/var/lib/rabbitmq \
  -v $(pwd)/rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf \
  rabbitmq:3-management
```

4. Wait until RabbitMQ be ready for connections. You will se something like
   "Ready to start client connection listeners" on logs.

```bash
docker ps # Take the container id
docker <container_id> logs -f
```

5. Download dependencies

```bash
npm install
```

6. Run the app

```bash
npm start
```

> Run from docker, if you prefer

```bash
# Running from Docker
docker compose up

# Or in background
docker compose up -d
```
