# Price Fetcher API

## Requirements

- Docker (recommended, any OS)
- Or: Node.js (v18+), npm

## Setup

### 1. Clone the repository

```sh
git clone <your-repo-url>
cd <your-repo-directory>
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```sh
cp .env.example .env
# Edit .env and add your SERPAPI_KEY and OPENAI_API_KEY
```

### 3. Build and Run with Docker (Recommended)

```sh
docker build -t price-fetcher .
docker run -p 3000:3000 --env-file .env price-fetcher
```

### 4. Or Run Locally

```sh
npm install
node index.js
```

## API Usage

POST `/api/prices`

**Request Body:**
```json
{
  "country": "US",
  "query": "iPhone 14 Pro, 128GB"
}
```

## Example Requests

### Linux/macOS/Git Bash

```sh
curl -X POST http://localhost:3000/api/prices -H "Content-Type: application/json" -d '{"country": "US", "query": "iPhone 14 Pro, 128GB"}'
```

### Windows PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/prices" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "country": "US", "query": "iPhone 14 Pro, 128GB" }'
```

