# GUARD
A Graphical Unit for Accident Reporting and Diagnostics to visually interact with road accident data and discover powerful insights.

## Requirements
- `Docker`

## Docker containers
There are two docker containers:
- `webpack`: contains the webpack application which includes nodejs and d3.js
    - `host port`: `8080`

- `server`: simple server which allows to serve files to d3.js
    - `host port`: `7000`

## Startup instructions
- Access the app directory: `cd app/`
- Run the project: `docker-compose up --build`
- Open a browser window and go to: `localhost:8080`

## Useful document location
- Report: `docs/report`
- Presentation: `docs/presentation`