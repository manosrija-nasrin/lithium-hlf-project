import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import { DisplayVal } from '../../patient/patient';
import { PatientService } from '../../patient/patient.service';
import { DoctorRecord, DoctorViewRecord } from '../doctor';
import { DoctorService } from '../doctor.service';

@Component({
  selector: 'app-doctor-list-for-patient',
  templateUrl: './doctor-list-for-patient.component.html',
  styleUrls: ['./doctor-list-for-patient.component.scss']
})
export class DoctorListForPatientComponent implements OnInit, OnDestroy {
  public healthID: any;
  public doctorRecords: Array<DoctorViewRecord> = [];
  public permissions = [];
  public grantObs$?: Observable<any>;
  public revokeObs$?: Observable<any>;
  private allSubs = new Subscription();
  public headerNames = [
    new DisplayVal(DoctorViewRecord.prototype.doctorId, 'Doctor Id'),
    new DisplayVal(DoctorViewRecord.prototype.fullName, 'Full Name')
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly doctorService: DoctorService,
    private readonly patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.allSubs.add(
      this.route.params.subscribe((params: Params) => {
        this.healthID = params.healthId;
        this.refresh();
      })
    );
  }

  ngOnDestroy(): void {
    this.allSubs.unsubscribe();
  }

  public refresh(): void {
    this.doctorRecords = [];
    this.allSubs.add(
      this.patientService.getPatientByKey(this.healthID).subscribe(x => {
        this.permissions = x.permissionGranted;
        this.fetchDoctorData();
      })
    );
  }

  public fetchDoctorData(): void {
    this.allSubs.add(
      this.doctorService.getDoctorsByHospitalId(1).subscribe(x => {
        const data = x as Array<DoctorRecord>;
        data.map(y => this.doctorRecords.push(new DoctorViewRecord(y)));
      })
    );
    this.allSubs.add(
      this.doctorService.getDoctorsByHospitalId(2).subscribe(x => {
        const data = x as Array<DoctorRecord>;
        data.map(y => this.doctorRecords.push(new DoctorViewRecord(y)));
      })
    );
  }

  public grant(doctorId: string): void {
    this.allSubs.add(
      this.patientService.grantAccessToDoctor(this.healthID, doctorId).subscribe(x => {
        console.log(x);
        this.refresh();
      })
    );
  }

  public revoke(doctorId: string): void {
    this.allSubs.add(
      this.patientService.revokeAccessFromDoctor(this.healthID, doctorId).subscribe(x => {
        console.log(x);
        this.refresh();
      })
    );
  }

  public isDoctorPresent(doctorId: string): boolean {
    // @ts-ignore
    return this.permissions.includes(doctorId);
  }
}
