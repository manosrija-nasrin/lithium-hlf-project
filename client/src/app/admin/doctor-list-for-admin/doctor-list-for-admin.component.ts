import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { DoctorViewRecord } from '../../doctor/doctor';
import { DoctorService } from '../../doctor/doctor.service';
import { DisplayVal } from '../../patient/patient';

@Component({
  selector: 'app-doctor-list-for-admin',
  templateUrl: './doctor-list-for-admin.component.html',
  styleUrls: ['./doctor-list-for-admin.component.scss']
})
export class DoctorListForAdminComponent implements OnInit, OnDestroy {
  public adminId: any;
  public doctorRecords$?: Observable<Array<DoctorViewRecord>>;
  private sub?: Subscription;
  public headerNames = [
    new DisplayVal(DoctorViewRecord.prototype.registration, 'Registration'),
    new DisplayVal(DoctorViewRecord.prototype.fullName, 'Full Name'),
    new DisplayVal(DoctorViewRecord.prototype.address, 'Address'),
    new DisplayVal(DoctorViewRecord.prototype.phoneNumber, 'Phone Number'),
    new DisplayVal(DoctorViewRecord.prototype.emergPhoneNumber, 'Emergency Phone Number')
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly doctorService: DoctorService,
    private readonly http: HttpClient
  ) { }

  ngOnInit(): void {
    this.sub = this.route.params.subscribe((params: Params) => {
      this.adminId = params.adminId;
      this.refresh();
    }, error => {
      console.error('Error in subscription:', error);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  public refresh(): void {
    if (this.adminId === 'hosp1admin') {
      this.doctorRecords$ = this.doctorService.getDoctorsByHospitalId(1);
    } else if (this.adminId === 'hosp2admin') {
      this.doctorRecords$ = this.doctorService.getDoctorsByHospitalId(2);
    } else {
      this.doctorRecords$ = this.doctorService.getDoctorsByHospitalId(3);
    }
  }
}
