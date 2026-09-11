const itemRepository = require('../repositories/itemRepository');
const claimRepository = require('../repositories/claimRepository');
const matchingService = require('../services/matchingService');
const { validateItemReport } = require('../../../../packages/shared/src');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');

exports.createFoundItem = async (req, res, next) => {
  try {
    const validation = validateItemReport(req.body, 'found');
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new BadRequestError(firstError, validation.errors);
    }

    const images = (req.files && req.files.length > 0)
      ? req.files.map(f => `/uploads/items/${f.filename}`)
      : [];

    const item = await itemRepository.createFound({
      ...req.body,
      userId: req.user.id,
      images,
      contact_number: req.body.contact_number || req.user.phone,
      contact_email: req.body.contact_email || req.user.email,
    });

    // Run two-way matching engine
    const matches = await matchingService.checkMatchesForFoundItem(item.id);

    res.status(201).json({
      message: 'Found item uploaded successfully.',
      item,
      matches,
      matchesFound: matches.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.getFoundItems = async (req, res, next) => {
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
      sort: req.query.sort,
    };
    const items = await itemRepository.queryFound(filters);
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
};

exports.getFoundItemById = async (req, res, next) => {
  try {
    const item = await itemRepository.findFoundById(req.params.id);
    if (!item) {
      throw new NotFoundError('Found item listing not found.');
    }

    // Privacy Shield (Section 34): Hide sensitive contact info unless authorized
    const currentUserId = req.user ? req.user.id : null;
    const isOwner = currentUserId && String(item.user_id) === String(currentUserId);
    const isAdmin = req.user && req.user.role === 'admin';
    const hasAcceptedClaim = currentUserId
      ? await claimRepository.hasAcceptedClaim(item.id, currentUserId)
      : false;

    const canViewContact = isOwner || isAdmin || hasAcceptedClaim;

    const responseItem = { ...item };
    if (!canViewContact) {
      responseItem.contact_number = '•••••••••• (Hidden for privacy)';
      responseItem.contact_email = '••••••••••@•••••• (Hidden for privacy)';
      responseItem.finder_phone = '•••••••••• (Hidden for privacy)';
      responseItem.finder_email = '••••••••••@•••••• (Hidden for privacy)';
    }
    responseItem.canViewContact = canViewContact;

    res.status(200).json({ item: responseItem });
  } catch (err) {
    next(err);
  }
};

exports.updateFoundItem = async (req, res, next) => {
  try {
    const item = await itemRepository.findFoundById(req.params.id);
    if (!item) {
      throw new NotFoundError('Found item not found.');
    }
    if (String(item.user_id) !== String(req.user.id) && req.user.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to update this listing.');
    }

    const allowed = ['item_name', 'category', 'brand', 'model', 'colour', 'found_date', 'found_time', 'found_location', 'description', 'identifying_details', 'additional_notes', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await itemRepository.updateFound(item.id, updates);
    res.status(200).json({
      message: 'Found item updated successfully.',
      item: updated,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteFoundItem = async (req, res, next) => {
  try {
    const item = await itemRepository.findFoundById(req.params.id);
    if (!item) {
      throw new NotFoundError('Found item not found.');
    }
    if (String(item.user_id) !== String(req.user.id) && req.user.role !== 'admin') {
      throw new ForbiddenError('You are not authorized to delete this listing.');
    }
    await itemRepository.deleteFound(item.id);
    res.status(200).json({ message: 'Found item listing deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
