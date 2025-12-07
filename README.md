# svgmaptools-api (仮)

## Starting the Server

```sh
docker compose up --build
```

## API Endpoints

### POST /shape2svgmap

#### Usage

```sh
curl -X POST -F "csv=@sample.csv" http://localhost:3000/shape2svgmap -o output.svg
```
