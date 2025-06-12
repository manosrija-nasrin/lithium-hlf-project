import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { DisplayVal, PatientDoctorViewRecord, PatientViewRecord } from '../../patient/patient';
import { PatientService } from '../../patient/patient.service';

@Component({
  selector: 'app-patient-list-for-doctor',
  templateUrl: './patient-list-for-doctor.component.html',
  styleUrls: ['./patient-list-for-doctor.component.scss']
})
export class PatientListForDoctorComponent implements OnInit {
  public doctorId: any;
  public patientRecordsObs$?: Observable<Array<PatientDoctorViewRecord>>;
  public headerNames = [
    new DisplayVal(PatientViewRecord.prototype.healthId, 'Health Id'),
    new DisplayVal(PatientViewRecord.prototype.firstName, 'First Name'),
    new DisplayVal(PatientViewRecord.prototype.lastName, 'Last Name')
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.doctorId = params['doctorId'] || '';
      this.refresh();
    });
  }

  public refresh(): void {
    this.patientRecordsObs$ = this.patientService.fetchAllPatients();
  }
}
