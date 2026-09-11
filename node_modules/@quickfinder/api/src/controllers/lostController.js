const itemRepository = require('../repositories/itemRepository');
const matchRepository = require('../repositories/matchRepository');
const matchingService = require('../services/matchingService');
const { validateItemReport } = require('@quickfinder/shared');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');

exports.createLostItem = async (req, res, next) => {
  try {
    const validation = validateItemReport(req.body, 'lost');
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new BadRequestError(firstError, validation.errors);
    }

    const images = (req.files && req.files.length > 0)
      ? req.files.map(f => `/uploads/items/${f.filename}`)
      : [];

    const item = await itemRepository.createLost({
      ...req.body,
      userId: req.user.id,
      images,
      contact_number: req.body.contact_number || req.user.phone,
      contact_email: req.body.contact_email || req.user.email,
    });

    // Run two-way matching engine
    const matches = await matchingService.checkMatchesForLostItem(item.id);

    res.status(201).json({
      message: 'Lost item report submitted successfully.',
      item,
      matches,
      matchesFound: matches.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.getLostItems = async (req, res, next) => {
  try {
    const userIdFilter = (req.query.userOnly === 'true' && req.user) ? req.user.id : req.query.userId;
    const filters = {
      search: req.query.search,
      category: req.query.category,
      location: req.query.location,
      date: req.query.date,
      colour: req.query.colour,
      status: req.query.status,
      userId: userIdFilter,
    };
    const items = await itemRepository.queryLost(filters);
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
};

exports.getLostItemById = async (req, res, next) => {
  try {
    const item = await itemRepository.findLostById(req.params.id);
    if (!item) {
      throw new NotFoundError('Lost item report not found.');
    }
    const matches = await matchRepository.findByLostItem(item.id);
    res.status(200).json({ item, matches });
  } catch (err) {
    next(err);
  }
};

exports.updateLostItem = async (req, res, next) => {
  try {
    const item = await itemRepository.findLostById(req.params.id);
    if (!item) {
      throw new NotFoundError('Lost item not found.');
    }
    if (String(item.user_id) !== String(req.user.id) && req.user.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to update this report.');
    }

    const allowed = ['item_name', 'category', 'brand', 'model', 'colour', 'lost_date', 'lost_time', 'lost_location', 'description', 'identifying_details', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await itemRepository.updateLost(item.id, updates);
    res.status(200).json({
      message: 'Lost item report updated.',
      item: updated,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteLostItem = async (req, res, next) => {
  try {
    const item = await itemRepository.findLostById(req.params.id);
    if (!item) {
      throw new NotFoundError('Lost item not found.');
    }
    if (String(item.user_id) !== String(req.user.id) && req.user.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to delete this report.');
    }
    await itemRepository.deleteLost(item.id);
    res.status(200).json({ message: 'Lost item report deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
