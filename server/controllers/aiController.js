const { aiProvider } = require('../config/aiProvider');

exports.extractAttributes = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text prompt required.' });
    const extracted = await aiProvider.extractReportAttributes(text);
    res.status(200).json({ extracted });
  } catch (err) {
    next(err);
  }
};

exports.enhanceDescription = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Description text required.' });
    const enhanced = await aiProvider.enhanceDescription(text);
    res.status(200).json({ enhanced });
  } catch (err) {
    next(err);
  }
};
