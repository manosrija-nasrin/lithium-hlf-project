class Receiver {
    constructor(name, aadhar, address, bloodGroup, quantity, orgName, dateOfRegistration, bagsResponse) {
        this.type = "receiverRecord";
        this.bloodGroup = bloodGroup;
        this.quantity = quantity;
        this.orgName = orgName;
        this.aadhar = aadhar;
        this.nameOfReceiver = name;
        this.address = address;
        this.dateOfRegistration = dateOfRegistration;
        this.left = 0;
        this.LTapproval = false;
        this.MOCapproval = false;
        this.bags = {};
        this.crossMatchedBy = {};
        for (let i = 0; i < bagsResponse.length; i++) {
            const bagKey = bagsResponse[i]["BagUnitNo"] + "-" + bagsResponse[i]["BagSegmentNo"];
            this.bags[bagKey] = 'false';
            this.crossMatchedBy[bagKey] = '';
            this.left++;
        }
        this.status = "not dispatched";
        return this;
    }
}

module.exports = Receiver;

