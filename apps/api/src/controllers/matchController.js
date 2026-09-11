const matchRepository = require('../repositories/matchRepository');
const { NotFoundError } = require('../utils/errors');

exports.getMyMatches = (req, res, next) => {
  try {
    const matches = matchRepository.findByUser(req.user.id);
    const parsedMatches = matches.map(m => {
      let reasons = [];
      try {
        reasons = JSON.parse(m.match_reasons || '[]');
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

exports.getMatchById = (req, res, next) => {
  try {
    const match = matchRepository.findById(req.params.id);
    if (!match) {
      throw new NotFoundError('Match record not found.');
    }
    let reasons = [];
    try {
      reasons = JSON.parse(match.match_reasons || '[]');
    } catch {
      reasons = [match.match_reasons];
    }
    res.status(200).json({ match: { ...match, match_reasons: reasons } });
  } catch (err) {
    next(err);
  }
};

exports.dismissMatch = (req, res, next) => {
  try {
    matchRepository.dismissMatch(req.params.id);
    res.status(200).json({ message: 'Match dismissed.' });
  } catch (err) {
    next(err);
  }
};
