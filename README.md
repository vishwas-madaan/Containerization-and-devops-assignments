# ☁️ Cloud Containerization & DevOps Learning Journey

This repository documents my hands-on learning and experiments in  
**Cloud Computing, Containerization, and DevOps**.
- [Repository link](https://github.com/vishwas-madaan/Containerization-and-devops-assignments.git)

---

## 👤 Student Details
- **Name:** Vishwas Madaan  
- **SAP ID:** 500122527  
- **BATCH:** 4

---

## Assignment-1:- Containerized Web Application with PostgreSQL using Docker Compose and Macvlan/Ipvlan

<hr>

<h4 align="center"> Pre-requisite </h4>

![Directory Structure](./Images/0.png)

<hr>

**Step-1:- Initialize a Node Package**
```bash
npm init -y
```
![Initialize Node Package](./Images/1.png)


**Step-2:- Install Necessary Package**
```bash
npm i express pg
```
![Install Package](./Images/2.png)


**Step-3:- The `package.json` will look as follows:-**
![package.json](./Images/3.png)


**Step-4:- The `server.js` will look as follows:-**
```js
const express = require("express");
const { Pool } = require("pg");


const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  port: 5432
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name TEXT
    )
  `);
}

initDB();

app.get("/health", (req, res) => {
  res.send("Server healthy");
});

app.post("/users", async (req, res) => {
  const { name } = req.body;

  const result = await pool.query(
    "INSERT INTO users(name) VALUES($1) RETURNING *",
    [name]
  );

  res.json(result.rows[0]);
});

app.get("/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
```
![server.js](./Images/4.png)


**Step-5:- The backend/`Dockerfile` will look as follows:-**
```Dockerfile
# Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

# Runtime Stage
FROM node:20-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app .

USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]
```
![Dockerfile of backend](./Images/5.png)


**Step-6:- The `.dockerignore` will look as follows:-**
```bash
node_modules
npm-debug.log
Dockerfile
.git
.gitignore
````
![dockerignore](./Images/6.png)


**Step-7:- The database/`Dockerfile` will look as follows:-**
```Dockerfile
FROM postgres:15-alpine

COPY init.sql /docker-entrypoint-initdb.d/
```
![Dockerfile](./Images/7.png)


**Step-8:- The `init.sql` will look as follows:-**
```sql
CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name TEXT
);
```
![init.sql](./Images/8.png)


**Step-9:- The `docker-compose.yml` will look as follows:-**
```docker-compose
version: "3.9"

services:

  database:
    build: ./database
    container_name: postgres_db
    restart: always

    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: dhairya

    volumes:
      - pgdata:/var/lib/postgresql/data

    networks:
      macvlan_net:
        ipv4_address: 192.168.50.21

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      retries: 5


  backend:
    build: ./backend
    container_name: node_backend
    restart: always

    environment:
      DB_HOST: 192.168.50.21
      POSTGRES_DB: mydb
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: dhairya

    depends_on:
      database:
        condition: service_healthy

    networks:
      macvlan_net:
        ipv4_address: 192.168.50.20


volumes:
  pgdata:

networks:
  macvlan_net:
    external: true
```
![docker-compose.yml](./Images/9.png)


**Step-10:- Find your interface**
```bash
ip a
```
![Find Interface](./Images/10.png)


**Step-11:- Create Network**
```bash
docker network create -d macvlan \
  --subnet=192.168.50.0/24 \
  --gateway=192.168.50.1 \
  -o parent=eth0 \
  macvlan_net
```
![Create Network](./Images/11.png)


**Step-12:- Build from Compose**
```bash
docker-compose up build --no-cache
```
![Build Compose](./Images/12.png)


**Step-13:- Start Services**
```bash
docker-compose up -d
```
![Start Service](./Images/13.png)


**Step-14:- Insert A User in DB in API**
```bash
curl -X POST http://localhost:3000/users \
-H "Content-Type: application/json" \
-d '{"name":"vishwas"}'
```
![Insert User](./Images/14.png)


**Step-15:- GET User API**
```bash
curl http://localhost:3000/users
```
![Get User API]


**Step-16:- List Running Container**
```bash
docker ps
```
![List Containers](./Images/16.png)


**Step-17:- List Volumes**
```bash
docker volume ls 
```
![List Volumes](./Images/17.png)


**Step-18:- Inspect Network**
```bash
docker network inspect macvlan_net
```
![Inspect Network](./Images/18.png)


**Step-19:- Inspect Backend Container**
```bash
docker inspect node_backend
```
![Inspect Backend](./Images/19.png)


**Step-20:- Inspect DB**
```bash
docker inspect postgres_db
```
![Inspect DB](./Images/20.png)


**Step-21:- Verify Data Persistence**
This step will verify that data stored in DB is permanently saved irrespective of the state of the container.
```bash
docker-compose down
(./Images/21.png)
docker-compose up -d
![Restart Compose](./Images/22.png)
curl http://localhost:3000/users
```
![Run API](./Images/23.png)



<hr>

<h4 align="center"> Report </h4>

<hr>


**_Build Optimization Explanation_**

Several optimization techniques were used while building the Docker images to make them efficient, secure, and lightweight.

First, a multi-stage build was used in the backend Dockerfile. In this approach, the application dependencies are installed in a builder stage, and only the necessary files are copied to the final runtime stage. This helps reduce the final image size because build tools and unnecessary files are not included in the runtime container.

Second, a minimal base image (node:20-alpine) was used instead of a full Node.js image. Alpine Linux is lightweight and helps reduce the image size significantly, resulting in faster downloads and faster container startup.

A .dockerignore file was also used to exclude unnecessary files such as node_modules, .git, and log files from the Docker build context. This improves build performance and prevents unwanted files from being included in the image.

> Finally, the container runs using a non-root user to improve security. Running containers without root privileges reduces potential risks if the application is compromised.


<br>

**_Network Design Diagram_**

![Network Diagram](./Images/22.jpg)


<br>


**_Image Size Comparison_**

Different base images can significantly affect the final Docker image size.

- node:20 => 1.1 GB
- node:20-alpine => 180 MB

The Alpine-based image is much smaller than the standard Node.js image. Using a smaller image reduces storage usage, speeds up image downloads, and improves container startup time.

Therefore, the `node:20-alpine` image was chosen in this project to create a lightweight and efficient container.


**_Macvlan Vs IPvlan_**

| Feature | MACVLAN | IPVLAN |
|--------|---------|--------|
| MAC addresses | One per container | One shared for all |
| Network switch load | Higher (learns many MACs) | Lower (one MAC) |
| Scalability | Limited by switch | Much higher |
| Best for | Small deployments | Large-scale |
