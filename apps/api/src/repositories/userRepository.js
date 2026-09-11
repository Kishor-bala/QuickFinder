const { getNextId, getAllRecords, getRecordById, setRecord, updateRecord, deleteRecord } = require('../services/firebaseDbService');

class UserRepository {
  async findById(id) {
    const user = await getRecordById('users', id);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async findByIdWithHash(id) {
    return await getRecordById('users', id);
  }

  async findByEmail(email) {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    const users = await getAllRecords('users');
    return users.find((u) => u.email && u.email.toLowerCase().trim() === clean) || null;
  }

  async findByUserId(userId) {
    if (!userId) return null;
    const clean = userId.toLowerCase().trim();
    const users = await getAllRecords('users');
    return users.find((u) => u.user_id && u.user_id.toLowerCase().trim() === clean) || null;
  }

  async findByIdentifier(identifier) {
    if (!identifier) return null;
    const clean = identifier.toLowerCase().trim();
    const users = await getAllRecords('users');
    return users.find((u) => 
      (u.email && u.email.toLowerCase().trim() === clean) || 
      (u.user_id && u.user_id.toLowerCase().trim() === clean)
    ) || null;
  }

  async findByFirebaseUid(firebaseUid) {
    if (!firebaseUid) return null;
    const users = await getAllRecords('users');
    return users.find((u) => u.firebase_uid === firebaseUid) || null;
  }

  async findByPhone(phone, excludeUserId = null) {
    if (!phone || !phone.trim()) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) return null;

    const users = await getAllRecords('users');
    return users.find((u) => {
      if (excludeUserId && String(u.id) === String(excludeUserId)) return false;
      const userPhoneClean = (u.phone || '').replace(/[^0-9]/g, '');
      return userPhoneClean === cleanPhone;
    }) || null;
  }

  async createFromFirebase({ name, user_id, email, phone, profile_photo, firebase_uid, provider }) {
    let finalUserId = user_id ? user_id.trim() : '';
    if (!finalUserId) {
      const baseId = email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase().substring(0, 20);
      finalUserId = baseId;
      let attempt = 0;
      const users = await getAllRecords('users');
      while (users.some((u) => u.user_id === finalUserId)) {
        attempt++;
        finalUserId = `${baseId}_${attempt}`;
      }
    }

    const newId = await getNextId('users');
    const newUser = {
      id: newId,
      name: name.trim(),
      user_id: finalUserId,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      password_hash: '',
      profile_photo: profile_photo || null,
      role: 'user',
      is_active: 1,
      firebase_uid,
      auth_provider: provider || 'firebase',
      created_at: new Date().toISOString(),
    };

    await setRecord('users', newId, newUser);
    return await this.findById(newId);
  }

  async updateFirebaseUid(id, firebaseUid, provider) {
    await updateRecord('users', id, { firebase_uid: firebaseUid, auth_provider: provider });
    return await this.findById(id);
  }

  async create({ name, user_id, email, phone, password_hash, profile_photo, role = 'user' }) {
    const newId = await getNextId('users');
    const newUser = {
      id: newId,
      name: name.trim(),
      user_id: user_id.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password_hash,
      profile_photo: profile_photo || null,
      role: role || 'user',
      is_active: 1,
      firebase_uid: null,
      auth_provider: 'local',
      created_at: new Date().toISOString(),
    };

    await setRecord('users', newId, newUser);
    return await this.findById(newId);
  }

  async updateProfile(id, { name, phone, profile_photo }) {
    const updates = { name: name.trim(), phone: phone.trim() };
    if (profile_photo) updates.profile_photo = profile_photo;
    await updateRecord('users', id, updates);
    return await this.findById(id);
  }

  async updatePassword(id, passwordHash) {
    return await updateRecord('users', id, { password_hash: passwordHash });
  }

  async updateStatus(id, isActive) {
    return await updateRecord('users', id, { is_active: isActive ? 1 : 0 });
  }

  async delete(id) {
    return await deleteRecord('users', id);
  }

  async listAll() {
    const users = await getAllRecords('users');
    const lostItems = await getAllRecords('lost_items');
    const foundItems = await getAllRecords('found_items');

    return users.map((u) => {
      const { password_hash, ...safe } = u;
      const lost_count = lostItems.filter((l) => String(l.user_id) === String(u.id)).length;
      const found_count = foundItems.filter((f) => String(f.user_id) === String(u.id)).length;
      return { ...safe, lost_count, found_count };
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async count() {
    const users = await getAllRecords('users');
    return users.length;
  }
}

module.exports = new UserRepository();
