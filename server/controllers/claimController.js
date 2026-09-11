const claimService = require('../services/claimService');

exports.createClaim = async (req, res, next) => {
  try {
    const { found_item_id, message, match_id } = req.body;
    const proof_image = req.file ? `/uploads/proofs/${req.file.filename}` : null;

    const claim = await claimService.submitClaim({
      found_item_id: parseInt(found_item_id, 10),
      claimant_id: req.user.id,
      message,
      proof_image,
      match_id: match_id ? parseInt(match_id, 10) : null,
    });

    res.status(201).json({
      message: 'Ownership claim submitted successfully. The finder has been notified.',
      claimId: claim.id,
      claim,
    });
  } catch (err) {
    next(err);
  }
};

exports.getClaims = async (req, res, next) => {
  try {
    const type = req.query.type || 'all';
    const result = await claimService.getClaims(req.user.id, type);
    if (type === 'received') {
      res.status(200).json({ claims: result });
    } else if (type === 'sent') {
      res.status(200).json({ claims: result });
    } else {
      res.status(200).json(result);
    }
  } catch (err) {
    next(err);
  }
};

exports.respondToClaim = async (req, res, next) => {
  try {
    const claimId = parseInt(req.params.id, 10);
    const { action } = req.body;
    const result = await claimService.respondToClaim(claimId, req.user.id, action);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
