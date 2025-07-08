const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const { Configuration, OpenAIApi } = require('openai')
require('dotenv').config()
const app = express()
app.use(express.json())
const port = process.env.PORT || 3000
const countrySites = {
  US: [
    {
      name: 'Amazon',
      search: q => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`
    },
    {
      name: 'Walmart',
      search: q => `https://www.walmart.com/search/?query=${encodeURIComponent(q)}`
    }
  ],
  IN: [
    {
      name: 'Flipkart',
      search: q => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`
    },
    {
      name: 'Amazon',
      search: q => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`
    }
  ]
}
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Connection': 'keep-alive'
}
const SERPAPI_KEY = process.env.SERPAPI_KEY;
async function fetchWalmartUS(query) {
  try {
    const url = `https://serpapi.com/search.json?engine=walmart&query=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
    console.log('WalmartUS URL:', url); // Debug log
    const res = await axios.get(url);
    if (res.data && res.data.organic_results) {
      const mapped = res.data.organic_results.map(product => ({
        productName: product.title || "",
        link: product.link_clean || product.link || product.url || product.product_link || "",
        price: product.primary_offer && product.primary_offer.price ? String(product.primary_offer.price) : (product.price ? String(product.price) : ""),
        currency: product.primary_offer && product.primary_offer.currency ? product.primary_offer.currency : "USD"
      }));
      const filtered = mapped.filter(p => (typeof p.link === 'string' && p.link.trim()) || (typeof p.price === 'string' && p.price.trim()));
      return filtered.length ? filtered : [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "USD" }];
    }
    return [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "USD" }];
  } catch (e) {
    console.error('Walmart SerpAPI error:', e.response ? e.response.data : e.message);
    return [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "USD" }];
  }
}

async function fetchAmazonIN(query) {
  try {
    const url = `https://serpapi.com/search.json?engine=amazon&k=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&amazon_domain=amazon.in`;
    console.log('AmazonIN URL:', url); // Debug log
    const res = await axios.get(url);
    console.log('AmazonIN raw response:', res.data);
    // Use products if available, else fallback to organic_results
    const products = res.data.products || res.data.organic_results;
    if (products && Array.isArray(products)) {
      const mapped = products.map(product => ({
        productName: product.title || "",
        link: product.link_clean || product.link || product.url || product.product_link || "",
        price: product.extracted_price !== undefined ? String(product.extracted_price) : (product.price ? String(product.price) : ""),
        currency: "INR"
      }));
      const filtered = mapped.filter(p => (typeof p.link === 'string' && p.link.trim()) || (typeof p.price === 'string' && p.price.trim()));
      return filtered.length ? filtered : [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "INR" }];
    }
    return [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "INR" }];
  } catch (e) {
    console.error('AmazonIN SerpAPI error:', e.response ? e.response.data : e.message);
    return [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "INR" }];
  }
}

async function fetchFlipkartIN(query) {
  try {
    const url = `https://serpapi.com/search.json?engine=flipkart&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
    console.log('FlipkartIN URL:', url); // Debug log
    const res = await axios.get(url);
    console.log('FlipkartIN raw response:', res.data); // Debug log
    if (res.data && res.data.organic_results) {
      const mapped = res.data.organic_results.map(product => ({
        productName: product.title || "",
        link: product.link_clean || product.link || product.url || product.product_link || "",
        price: product.price ? String(product.price) : "",
        currency: product.currency || "INR"
      }));
      const filtered = mapped.filter(p => (typeof p.link === 'string' && p.link.trim()) || (typeof p.price === 'string' && p.price.trim()));
      return filtered.length ? filtered : [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "INR" }];
    }
    return [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "INR" }];
  } catch (e) {
    console.error('FlipkartIN SerpAPI error:', e.response ? e.response.data : e.message);
    return [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "INR" }];
  }
}
async function fetchAmazonUS(query) {
  try {
    const url = `https://serpapi.com/search.json?engine=amazon&k=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&amazon_domain=amazon.com`;
    console.log('AmazonUS URL:', url); // Debug log
    const res = await axios.get(url);
    console.log('AmazonUS raw response:', res.data);
    // Use products if available, else fallback to organic_results
    const products = res.data.products || res.data.organic_results;
    if (products && Array.isArray(products)) {
      const mapped = products.map(product => ({
        productName: product.title || "",
        link: product.link_clean || product.link || product.url || product.product_link || "",
        price: product.extracted_price !== undefined ? String(product.extracted_price) : (product.price ? String(product.price) : ""),
        currency: "USD"
      }));
      const filtered = mapped.filter(p => (typeof p.link === 'string' && p.link.trim()) || (typeof p.price === 'string' && p.price.trim()));
      return filtered.length ? filtered : [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "USD" }];
    }
    return [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "USD" }];
  } catch (e) {
    console.error('AmazonUS SerpAPI error:', e.response ? e.response.data : e.message);
    return [{ productName: "No valid products with links or prices found for this query.", link: "", price: "", currency: "USD" }];
  }
}
async function fetchWithLLM(country, query) {
  try {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY })
    const openai = new OpenAIApi(configuration)
    const prompt = `List 3 popular e-commerce sites in ${country} for buying: ${query}. For each, give a search URL for the product.`
    const resp = await openai.createChatCompletion({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }] })
    const text = resp.data.choices[0].message.content
    const urls = []
    text.split('\n').forEach(line => {
      const m = line.match(/https?:\/\/\S+/)
      if (m) urls.push(m[0])
    })
    const results = []
    for (const url of urls) {
      try {
        const res = await axios.get(url, { headers })
        console.log(res.data.slice(0, 500))
        const $ = cheerio.load(res.data)
        $('a').each((i, el) => {
          const name = $(el).text().trim()
          const link = $(el).attr('href')
          if (name && link && name.toLowerCase().includes(query.split(',')[0].toLowerCase())) {
            results.push({ link, price: '', currency: '', productName: name })
          }
        })
      } catch (e) {}
    }
    console.log(results)
    return results
  } catch (e) {
    return []
  }
}
function sortResults(results) {
  return results.filter(x => x.price).sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
}
app.post('/api/prices', async (req, res) => {
  const { country, query } = req.body;
  console.log('Received country:', country, 'query:', query); // Debug log
  let results = [];
  if (country === 'US') {
    const [a, w] = await Promise.all([
      fetchAmazonUS(query),
      fetchWalmartUS(query)
    ]);
    results = [...a, ...w];
  } else if (country === 'IN') {
    const [a, f] = await Promise.all([
      fetchAmazonIN(query),
      fetchFlipkartIN(query)
    ]);
    results = [...a, ...f];
  } else {
    results = [];
  }
  res.json(results);
});
app.listen(port, () => { console.log('Server running on port ' + port) })