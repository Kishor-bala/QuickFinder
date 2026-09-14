const handoverService = require('../services/handoverService');

exports.getLocations = async (req, res, next) => {
  try {
    const locations = await handoverService.getLocations();
    res.status(200).json({ locations });
  } catch (err) {
    next(err);
  }
};

exports.createToken = async (req, res, next) => {
  try {
    const { claimId } = req.body;
    const result = await handoverService.createHandoverToken({ claimId, userId: req.user.id });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    const { handoverId, token } = req.body;
    const result = await handoverService.verifyHandoverToken({ handoverId, token, verifyingUserId: req.user.id });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
