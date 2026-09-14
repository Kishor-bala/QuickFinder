/**
 * AI & Embedding Provider Abstraction
 * Supports Google Gemini API for semantic extraction & embeddings,
 * with graceful deterministic fallback if API keys are missing or unavailable.
 */
const config = require('./index');

class AIProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  }

  /**
   * Extract structured item attributes from natural text using Gemini / AI
   * Example: "lost black milton water bottle near cse lab yesterday"
   */
  async extractReportAttributes(text) {
    if (!this.apiKey) {
      return this.fallbackExtract(text);
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract structured item details from this lost/found report text. Return ONLY a valid JSON object with keys: category, color, brand, location, building, date. Text: "${text}"`
            }]
          }]
        })
      });

      if (!response.ok) throw new Error(`Gemini API HTTP ${response.status}`);
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.warn('[AIProvider] Gemini extraction fallback:', err.message);
      return this.fallbackExtract(text);
    }
  }

  fallbackExtract(text) {
    const lower = (text || '').toLowerCase();
    const categories = ['Electronics', 'Books & Stationery', 'ID Cards & Wallets', 'Keys', 'Clothing & Accessories', 'Bags & Backpacks', 'Water Bottles & Containers', 'Sports Gear', 'Others'];
    const colors = ['black', 'blue', 'red', 'white', 'silver', 'grey', 'green', 'yellow', 'brown', 'pink'];

    const foundCategory = categories.find(c => lower.includes(c.toLowerCase().split(' ')[0])) || 'Others';
    const foundColor = colors.find(c => lower.includes(c)) || '';
    const foundBrand = ['apple', 'samsung', 'hp', 'dell', 'lenovo', 'milton', 'nike', 'adidas', 'fastrack', 'casio'].find(b => lower.includes(b)) || '';

    return {
      category: foundCategory,
      color: foundColor,
      brand: foundBrand ? foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1) : '',
      location: text,
      building: '',
      date: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Enhance description for user approval
   */
  async enhanceDescription(text) {
    if (!this.apiKey) return text;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Refine and format this lost & found item description for campus clarity. Keep it concise, polite, and factual without adding unverified details. Text: "${text}"`
            }]
          }]
        })
      });

      if (!response.ok) return text;
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
    } catch {
      return text;
    }
  }
}

class EmbeddingProvider {
  /**
   * Calculate Jaccard / Cosine similarity between two text strings
   */
  calculateSimilarity(textA = '', textB = '') {
    if (!textA || !textB) return 0;
    const wordsA = new Set(textA.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2));
    const wordsB = new Set(textB.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2));

    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) intersection++;
    }

    const union = new Set([...wordsA, ...wordsB]).size;
    return Math.round((intersection / union) * 100) / 100;
  }
}

module.exports = {
  aiProvider: new AIProvider(),
  embeddingProvider: new EmbeddingProvider()
};
