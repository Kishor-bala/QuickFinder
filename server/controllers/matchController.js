const matchRepository = require('../repositories/matchRepository');
const { NotFoundError } = require('../utils/errors');

exports.getMyMatches = async (req, res, next) => {
  try {
    const rawMatches = await matchRepository.findByUser(req.user.id);
    const matches = Array.isArray(rawMatches) ? rawMatches : [];
    const parsedMatches = matches.map(m => {
      let reasons = [];
      try {
        reasons = typeof m.match_reasons === 'string' ? JSON.parse(m.match_reasons || '[]') : (m.match_reasons || []);
      } catch {
        reasons = [m.match_reasons];
      }
      return { ...m, match_reasons: reasons };
    });
    res.status(200).json({ matches: parsedMatches });
  } catch (err) {
    next(err);
  }
};

exports.getMatchById = async (req, res, next) => {
  try {
    const match = await matchRepository.findById(req.params.id);
    if (!match) {
      throw new NotFoundError('Match record not found.');
    }
    let reasons = [];
    try {
      reasons = typeof match.match_reasons === 'string' ? JSON.parse(match.match_reasons || '[]') : (match.match_reasons || []);
    } catch {
      reasons = [match.match_reasons];
    }
    res.status(200).json({ match: { ...match, match_reasons: reasons } });
  } catch (err) {
    next(err);
  }
};

exports.dismissMatch = async (req, res, next) => {
  try {
    await matchRepository.dismissMatch(req.params.id);
    res.status(200).json({ message: 'Match dismissed.' });
  } catch (err) {
    next(err);
  }
};
