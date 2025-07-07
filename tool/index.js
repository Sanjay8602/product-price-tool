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
async function fetchAmazonUS(query) {
  const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const $ = cheerio.load(res.data)
  const results = []
  $('.s-result-item').each((i, el) => {
    const name = $(el).find('h2 a span').text().trim()
    const link = 'https://www.amazon.com' + $(el).find('h2 a').attr('href')
    const price = $(el).find('.a-price .a-offscreen').first().text().replace(/[^\d.]/g, '')
    if (name && link && price) {
      results.push({ link, price, currency: 'USD', productName: name })
    }
  })
  return results
}
async function fetchWalmartUS(query) {
  const url = `https://www.walmart.com/search/?query=${encodeURIComponent(query)}`
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const $ = cheerio.load(res.data)
  const results = []
  $('[data-type="items"] .mb1').each((i, el) => {
    const name = $(el).find('a span').text().trim()
    const link = 'https://www.walmart.com' + $(el).find('a').attr('href')
    const price = $(el).find('span[data-automation-id="product-price"]').text().replace(/[^\d.]/g, '')
    if (name && link && price) {
      results.push({ link, price, currency: 'USD', productName: name })
    }
  })
  return results
}
async function fetchAmazonIN(query) {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const $ = cheerio.load(res.data)
  const results = []
  $('.s-result-item').each((i, el) => {
    const name = $(el).find('h2 a span').text().trim()
    const link = 'https://www.amazon.in' + $(el).find('h2 a').attr('href')
    const price = $(el).find('.a-price .a-offscreen').first().text().replace(/[^\d.]/g, '')
    if (name && link && price) {
      results.push({ link, price, currency: 'INR', productName: name })
    }
  })
  return results
}
async function fetchFlipkartIN(query) {
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const $ = cheerio.load(res.data)
  const results = []
  $('._1AtVbE').each((i, el) => {
    const name = $(el).find('._4rR01T').text().trim() || $(el).find('.s1Q9rs').attr('title')
    const link = 'https://www.flipkart.com' + ($(el).find('a._1fQZEK').attr('href') || $(el).find('.s1Q9rs').attr('href'))
    const price = $(el).find('._30jeq3').first().text().replace(/[^\d.]/g, '')
    if (name && link && price) {
      results.push({ link, price, currency: 'INR', productName: name })
    }
  })
  return results
}
async function fetchWithLLM(country, query) {
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
      const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
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
  return results
}
function sortResults(results) {
  return results.filter(x => x.price).sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
}
app.post('/api/prices', async (req, res) => {
  const { country, query } = req.body
  let results = []
  if (country === 'US') {
    const [a, w] = await Promise.all([fetchAmazonUS(query), fetchWalmartUS(query)])
    results = [...a, ...w]
  } else if (country === 'IN') {
    const [a, f] = await Promise.all([fetchAmazonIN(query), fetchFlipkartIN(query)])
    results = [...a, ...f]
  } else {
    results = await fetchWithLLM(country, query)
  }
  res.json(sortResults(results))
})
app.listen(port) 