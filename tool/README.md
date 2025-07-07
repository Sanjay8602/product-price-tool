# Price Fetcher API

## Setup

1. Clone the repository
2. Copy .env.example to .env and add your OpenAI API key
3. Build and run with Docker:

```
docker build -t price-fetcher .
docker run -p 3000:3000 --env-file .env price-fetcher
```

Or run locally:

```
npm install
node index.js
```

## API Usage

POST /api/prices

Body:
```
{
  "country": "US",
  "query": "iPhone 16 Pro, 128GB"
}
```

## Example curl

```
curl -X POST http://localhost:3000/api/prices -H "Content-Type: application/json" -d '{"country": "US", "query": "iPhone 16 Pro, 128GB"}'
```

```
curl -X POST http://localhost:3000/api/prices -H "Content-Type: application/json" -d '{"country": "IN", "query": "boAt Airdopes 311 Pro"}'
```

## Proof

Run the curl command for {"country": "US", "query": "iPhone 16 Pro, 128GB"} and take a screenshot of the output. 