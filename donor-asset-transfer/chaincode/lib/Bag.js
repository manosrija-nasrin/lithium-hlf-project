class Bag {

    constructor(bloodBagUnitNo, bloodBagSegmentNo, dateOfCollection, dateOfExpiry, quantity, bloodGroup, hospName)
    {
    	this.type = "tempRecord";
        this.bloodBagUnitNo = bloodBagUnitNo;
        this.bloodBagSegmentNo = bloodBagSegmentNo;
        this.dateOfCollection = dateOfCollection;
        this.dateOfExpiry = dateOfExpiry;
        this.quantity = quantity;
        this.bloodGroup = bloodGroup;
        this.hospName= hospName;
        return this;
    }
}
module.exports = Bag
