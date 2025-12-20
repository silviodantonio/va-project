# D3.JS APP

## Docker containers
There are two docker containers:
- `webpack`: contains the webpack application which includes nodejs and d3.js
    - `host port`: `8080`

- `server`: simple server which allows to serve files to d3.js
    - `host port`: `7000`

### Startup instructions
- Run the project: `docker-compose up --build`
- Open a new terminal for `containerName` : `docker-compose exec containerName sh`
- Remove the containers: `docker-compose down`