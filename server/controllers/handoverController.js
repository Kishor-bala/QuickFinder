const handoverService = require('../services/handoverService');

exports.getLocations = async (req, res, next) => {
  try {
    const locations = await handoverService.getLocations();
    res.status(200).json({ locations });
  } catch (err) {
    next(err);
  }
};

exports.recordHandover = async (req, res, next) => {
  try {
    const { found_item_id, handover_location, notes } = req.body;
    const handover = await handoverService.recordHandover({
      found_item_id,
      staff_uid: req.user.id,
      handover_location,
      notes,
    });
    res.status(201).json({ handover });
  } catch (err) {
    next(err);
  }
};
