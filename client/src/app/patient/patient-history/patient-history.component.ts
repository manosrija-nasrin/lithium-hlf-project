import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import { Observable, Subscription } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { RoleEnum } from '../../utils';
import { DisplayVal, PatientViewRecord } from '../patient';
import { PatientService } from '../patient.service';

@Component({
  selector: 'app-patient-history',
  templateUrl: './patient-history.component.html',
  styleUrls: ['./patient-history.component.scss']
})
export class PatientHistoryComponent implements OnInit, OnDestroy {
  public healthID: any;
  public patientRecordHistoryObs$?: Observable<Array<PatientViewRecord>>;
  public data: any;
  private sub?: Subscription;
  headerNames = [
    new DisplayVal(PatientViewRecord.prototype.Timestamp, 'Date'),
    new DisplayVal(PatientViewRecord.prototype.changedBy, 'Last changed by'),
    new DisplayVal(PatientViewRecord.prototype.firstName, 'First Name'),
    new DisplayVal(PatientViewRecord.prototype.lastName, 'Last Name'),
    new DisplayVal(PatientViewRecord.prototype.dob, 'Date of Birth'),
    new DisplayVal(PatientViewRecord.prototype.bloodGroup, 'Blood Group'),
    new DisplayVal(PatientViewRecord.prototype.sex, 'Sex'),
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly patientService: PatientService,
    private readonly authService: AuthService
  ) { }

  ngOnInit(): void {
    if (this.isPatient()) {
      this.headerNames.push(
        new DisplayVal(PatientViewRecord.prototype.address, 'Address'),
        new DisplayVal(PatientViewRecord.prototype.phoneNumber, 'Contact number'),
        new DisplayVal(PatientViewRecord.prototype.aadhar, 'Aadhar number'),
        new DisplayVal(PatientViewRecord.prototype.sex, 'Sex')
      );
    }
    this.headerNames.push(
      new DisplayVal(PatientViewRecord.prototype.alert, 'Alert'),
      new DisplayVal(PatientViewRecord.prototype.isDiseased, 'Is Diseased'),
      new DisplayVal(PatientViewRecord.prototype.healthCreditPoints, 'Health Credit Points'),
      new DisplayVal(PatientViewRecord.prototype.deferralStatus, 'Donation Status'),
      new DisplayVal(PatientViewRecord.prototype.donationHistory, 'Donation History')
    );
    this.sub = this.route.params
      .subscribe((params: Params) => {
        this.healthID = params.healthId;
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  public refresh(): void {
    this.patientRecordHistoryObs$ = this.patientService.getPatientHistoryByKey(this.healthID);
  }

  public isPatient(): boolean {
    return this.authService.getRole() === RoleEnum.PATIENT;
  }

  public convertToDate(val: any): string {
    return new Date(val.seconds.low * 1000).toDateString();
  }
}
