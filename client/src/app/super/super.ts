export interface SuperRecord {
  id: string;
  fullName: string;
  address: string;
  phoneNumber: string;
  emergPhoneNumber: string;
  registration: string;
  role: string;
}

export class SuperViewRecord {
  superId = '';
  fullName = '';
  address = '';
  registration = '';
  phoneNumber = '';
  role = '';
  emergPhoneNumber = '';

  constructor(readonly superRecord: SuperRecord) {
    this.superId = superRecord.id;
    this.fullName = superRecord.fullName;
    this.address = superRecord.address;
    this.role = superRecord.role;
    this.phoneNumber = superRecord.phoneNumber;
    this.registration = superRecord.registration;
    this.emergPhoneNumber = superRecord.emergPhoneNumber;
  }
}

export class DisplayVal {
  keyName: string | number | boolean;
  displayName: string;

  constructor(key: string | number | boolean, value: string) {
    this.keyName = key;
    this.displayName = value;
  }
}
