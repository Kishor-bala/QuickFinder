const { embeddingProvider } = require('../../config/aiProvider');

function matchDescription(desc1, desc2) {
  if (!desc1 || !desc2) return 0.5;
  try {
    return embeddingProvider.calculateSimilarity(desc1, desc2);
  } catch {
    return 0.5;
  }
}

module.exports = { matchDescription };
