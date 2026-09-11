const userRepository = require('../repositories/userRepository');
const itemRepository = require('../repositories/itemRepository');
const matchRepository = require('../repositories/matchRepository');
const claimRepository = require('../repositories/claimRepository');
const { BadRequestError, NotFoundError } = require('../utils/errors');

class AdminService {
  async getMetrics() {
    const totalUsers = await userRepository.count();
    const totalLostItems = await itemRepository.countLost();
    const totalFoundItems = await itemRepository.countFound();
    const successfulMatches = await matchRepository.countSuccessful();
    const claimedItems = await itemRepository.countClaimed();
    const pendingClaims = await claimRepository.countPending();

    return {
      totalUsers,
      totalLostItems,
      totalFoundItems,
      successfulMatches,
      claimedItems,
      pendingClaims,
    };
  }

  async getUsers() {
    return await userRepository.listAll();
  }

  async setUserStatus(userId, isActive, currentAdminId) {
    if (String(userId) === String(currentAdminId)) {
      throw new BadRequestError('Administrators cannot deactivate their own account.');
    }
    await userRepository.updateStatus(userId, isActive);
    return { message: `User status updated to ${isActive ? 'active' : 'disabled'}.` };
  }

  async getLostItems() {
    return await itemRepository.queryLost();
  }

  async getFoundItems() {
    return await itemRepository.queryFound();
  }

  async getClaimsAudit() {
    return await claimRepository.listAllForAdmin();
  }

  async deleteItem(type, id) {
    if (type === 'lost') {
      const item = await itemRepository.findLostById(id);
      if (!item) throw new NotFoundError('Lost item not found.');
      await itemRepository.deleteLost(id);
    } else if (type === 'found') {
      const item = await itemRepository.findFoundById(id);
      if (!item) throw new NotFoundError('Found item not found.');
      await itemRepository.deleteFound(id);
    } else {
      throw new BadRequestError('Invalid item type. Must be "lost" or "found".');
    }
    return { message: `${type === 'lost' ? 'Lost' : 'Found'} item listing deleted successfully.` };
  }

  async resolveItem(type, id) {
    if (type === 'lost') {
      const item = await itemRepository.findLostById(id);
      if (!item) throw new NotFoundError('Lost item not found.');
      await itemRepository.updateLost(id, { status: 'Closed' });
    } else if (type === 'found') {
      const item = await itemRepository.findFoundById(id);
      if (!item) throw new NotFoundError('Found item not found.');
      await itemRepository.updateFound(id, { status: 'Resolved' });
    } else {
      throw new BadRequestError('Invalid item type. Must be "lost" or "found".');
    }
    return { message: `${type === 'lost' ? 'Lost' : 'Found'} item marked as resolved.` };
  }
}

module.exports = new AdminService();
