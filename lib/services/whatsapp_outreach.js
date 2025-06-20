const Schmervice = require('schmervice');

module.exports = class WhatsappOutreachService extends Schmervice.Service {
  async findById(id, txn = null) {
    const { WhatsappOutreach } = this.server.models();
    const whatsappOutreach = await WhatsappOutreach.query(txn).throwIfNotFound().findById(id).withGraphFetched('options');
    return whatsappOutreach;
  }

  async create(whatsappOutreach, txn = null) {
    const { WhatsappOutreach } = this.server.models();
    const whatsappOutreachCreate = await WhatsappOutreach.query(txn).insertGraph(whatsappOutreach);
    return whatsappOutreachCreate;
  }

  async findAll(txn) {
    const { WhatsappOutreach } = this.server.models();
    const whatsappOutreach = await WhatsappOutreach.query(txn).withGraphFetched('options');
    return whatsappOutreach;
  }

  async update(whatsappOutreach, txn = null) {
    const { WhatsappOutreach } = this.server.models();
    const whatsappOutreachUpdate = await WhatsappOutreach.query(txn).update(whatsappOutreach).where('id', whatsappOutreach.id);
    return whatsappOutreachUpdate
  }

  async delete(id, txn = null) {
    const { WhatsappOutreach } = this.server.models();
    await WhatsappOutreach.query(txn).delete().findById(id);
  }

  async bulkCreate(dataArr) {
    const { WhatsappOutreach } = this.server.models();
    if (!Array.isArray(dataArr) || dataArr.length === 0) {
      throw new Error('Input must be a non-empty array');
    }
    return WhatsappOutreach.query().insert(dataArr);
  }

  async fetchPaginatedAndFiltered({ page = 1, pageSize = 20, filters = {} }) {
    const { WhatsappOutreach } = this.server.models();
    let query = WhatsappOutreach.query();

    // Apply filters
    if (filters.name) {
      query = query.where('name', 'like', `%${filters.name}%`);
    }
    if (filters.contact_number) {
      query = query.where('contact_number', 'like', `%${filters.contact_number}%`);
    }
    if (typeof filters.message_sent === 'boolean') {
      query = query.where('message_sent', filters.message_sent);
    }
    if (typeof filters.responded === 'boolean') {
      query = query.where('responded', filters.responded);
    }

    // Get total count for pagination
    const total = await query.resultSize();

    // Apply pagination
    const data = await query
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .orderBy('id', 'desc');

    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  }
};
