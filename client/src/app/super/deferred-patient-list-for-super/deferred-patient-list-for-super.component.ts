import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { DisplayVal, PatientSuperViewRecord } from '../../patient/patient';
import { SuperService } from '../super.service';

@Component({
  selector: 'deferred-patient-list-for-super',
  templateUrl: './deferred-patient-list-for-super.component.html',
  styleUrls: ['./deferred-patient-list-for-super.component.scss']
})
export class DeferredPatientListForSuperComponent implements OnInit {
  public superId: string;
  public hospId: string;
  public patientRecordsObs$?: Observable<Array<PatientSuperViewRecord>>;
  public headerNames = [
    new DisplayVal(PatientSuperViewRecord.prototype.healthId, 'Health Id'),
    new DisplayVal(PatientSuperViewRecord.prototype.firstName, 'First Name'),
    new DisplayVal(PatientSuperViewRecord.prototype.lastName, 'Last Name'),
    new DisplayVal(PatientSuperViewRecord.prototype.deferredDetails?.deferredOn, 'Deferred On'),
    new DisplayVal(PatientSuperViewRecord.prototype.deferredReason, 'Reason'),
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly superService: SuperService
  ) {
    this.superId = '';
    this.hospId = '';
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.superId = params['superId'] || '';
      this.hospId = this.superId.slice(4, 5);
      this.refresh();
    });
  }

  public refresh(): void {
    this.patientRecordsObs$ = this.superService.getDeferredPatients(this.hospId, this.superId);
    this.patientRecordsObs$.subscribe(records => {
      console.log("Array:", records);
    })
  }
}
