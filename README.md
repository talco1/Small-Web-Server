# Web-Server

A small web server that gives information on daily COVID-19 confirmed cases. The server handles:
1. GET request "/COUNTRY/DATE", the server returns information about daily new confirmed cases in the given country.
2. GET request "/SOURCE_CONTRY/TARGET_COUNTRY/FROM_DATE/TO_DATE", the server returns the daily difference between the percentages of the population confirmed cases.

### Installations

```bash
git clone https://github.com/talco1/Web-Server.git .
npm install express
npm install node-fetch
```
### Running the server

#### Locally

copy to terminal
```bash
node server.js
```
#### Docker

Install Docker Desktop [for windows](https://docs.docker.com/desktop/windows/install/), [for Ubuntu](https://docs.docker.com/engine/install/ubuntu/)

Build
```bash
docker build . -t node_web_app
```
Run
```bash
docker run -p 8080:8080 -d node_web_app
```

##### You can access to the web-server on localhost:8080/
