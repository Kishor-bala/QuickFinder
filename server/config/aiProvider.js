/**
 * AI & Embedding Provider Abstraction
 * Powered by Groq API (groq/compound-mini) for ultra-fast natural text extraction & enhancement,
 * with deterministic fallback if API is unreachable.
 */

class AIProvider {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
  }

  /**
   * Extract structured item attributes from natural text using Groq AI
   * Example input: "I lost my black Apple iPhone 14 Pro near CSE block canteen around 2 PM yesterday"
   */
  async extractReportAttributes(text) {
    const key = process.env.GROQ_API_KEY || this.groqApiKey;
    if (!key) {
      return this.fallbackExtract(text);
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'groq/compound-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant for a college campus lost & found platform. Respond ONLY with a valid JSON object with keys: item_name, category, brand, model, colour, building, lost_location, description.'
            },
            {
              role: 'user',
              content: `Extract structured item details from this report text: "${text}"`
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);

      return {
        item_name: parsed.item_name || '',
        category: this.normalizeCategory(parsed.category),
        brand: parsed.brand || '',
        model: parsed.model || '',
        colour: parsed.colour || parsed.color || '',
        building: parsed.building || '',
        lost_location: parsed.lost_location || parsed.location || text,
        description: parsed.description || text
      };
    } catch (err) {
      console.warn('[AIProvider] Groq extraction fallback:', err.message);
      return this.fallbackExtract(text);
    }
  }

  normalizeCategory(cat = '') {
    const lower = cat.toLowerCase();
    if (lower.includes('phone') || lower.includes('mobile')) return 'Mobile';
    if (lower.includes('laptop') || lower.includes('computer')) return 'Laptop';
    if (lower.includes('wallet') || lower.includes('purse')) return 'Wallet';
    if (lower.includes('id') || lower.includes('card')) return 'ID Card';
    if (lower.includes('key')) return 'Keys';
    if (lower.includes('bag') || lower.includes('backpack')) return 'Bag';
    if (lower.includes('book') || lower.includes('stationery')) return 'Books & Stationery';
    if (lower.includes('electronic') || lower.includes('gadget')) return 'Electronics';
    if (lower.includes('bottle') || lower.includes('flask')) return 'Water Bottles & Containers';
    if (lower.includes('watch') || lower.includes('accessory')) return 'Accessories';
    return 'Other';
  }

  fallbackExtract(text) {
    const lower = (text || '').toLowerCase();
    const categories = ['Mobile', 'Laptop', 'Wallet', 'ID Card', 'Keys', 'Bag', 'Books & Stationery', 'Electronics', 'Accessories', 'Water Bottles & Containers', 'Other'];
    const colors = ['black', 'blue', 'red', 'white', 'silver', 'grey', 'green', 'yellow', 'brown', 'pink'];

    const foundCategory = categories.find(c => lower.includes(c.toLowerCase().split(' ')[0])) || 'Other';
    const foundColor = colors.find(c => lower.includes(c)) || '';
    const foundBrand = ['apple', 'samsung', 'hp', 'dell', 'lenovo', 'milton', 'nike', 'adidas', 'fastrack', 'casio'].find(b => lower.includes(b)) || '';

    return {
      item_name: foundBrand ? `${foundBrand.toUpperCase()} Item` : 'Lost Item',
      category: foundCategory,
      colour: foundColor,
      brand: foundBrand ? foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1) : '',
      model: '',
      lost_location: text,
      building: 'Main Block',
      description: text
    };
  }

  /**
   * Enhance description for campus clarity using Groq AI
   */
  async enhanceDescription(text) {
    const key = process.env.GROQ_API_KEY || this.groqApiKey;
    if (!key) return text;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'groq/compound-mini',
          messages: [
            {
              role: 'system',
              content: 'Refine and format this lost & found item description for campus clarity. Keep it concise, polite, and factual without adding unverified details.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) return text;
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || text;
    } catch {
      return text;
    }
  }
}

class EmbeddingProvider {
  /**
   * Calculate Jaccard similarity between two text strings
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
