const Schmervice = require('schmervice');

module.exports = class OutreachService extends Schmervice.Service {
  async getAllOutreachCoordinators(txn = null) {
    const { Partner } = this.server.models();
    return Partner.query(txn).select('referred_by').whereNotNull('referred_by');
  }

  async getAllOutreachData() {
    const { Partner } = this.server.models();
    const allData = await Partner.query()
      .whereNotNull('referred_by')
      .withGraphFetched('students')
      .modifyGraph('students', (builder) => {
        builder.where('stage', 'finalisedTravelPlans');
      });
    const outreaches = {};
    allData.forEach((data) => {
      if (outreaches[data.referred_by]) {
        const partnerName = {};
        partnerName[data.name] = data.students.length;
        outreaches[data.referred_by].partners.push(partnerName);
      } else {
        const partnerName = {};
        const newPartner = {};
        newPartner[data.name] = data.students.length;
        partnerName.partners = [newPartner];
        outreaches[data.referred_by] = partnerName;
      }
    });
    return outreaches;
  }
};
