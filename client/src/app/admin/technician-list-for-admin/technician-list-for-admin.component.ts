import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import { Observable, Subscription } from 'rxjs';

import { TechnicianService } from '../../technician/technician.service';
import { DisplayVal} from '../../donor/donor';
import {TechnicianViewRecord} from '../../technician/technician';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-technician-list-for-admin',
  templateUrl: './technician-list-for-admin.component.html',
  styleUrls: ['./technician-list-for-admin.component.scss']
})
export class TechnicianListForAdminComponent implements OnInit, OnDestroy { 
  public adminId:any;
  public technicianRecords$?: Observable<Array<TechnicianViewRecord>>;
  private sub?: Subscription;
  public headerNames = [
    new DisplayVal(TechnicianViewRecord.prototype.registration, 'Registration'),
    new DisplayVal(TechnicianViewRecord.prototype.fullName, 'Full Name'),
    new DisplayVal(TechnicianViewRecord.prototype.address, 'Address'),
    new DisplayVal(TechnicianViewRecord.prototype.phoneNumber, 'Phone Number'),
    new DisplayVal(TechnicianViewRecord.prototype.emergPhoneNumber, 'Emergency Phone Number'),
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly technicianService: TechnicianService,
    private readonly http: HttpClient
  ) { }

 ngOnInit(): void {
    this.sub = this.route.params
      .subscribe((params: Params) => {
        this.adminId = params.adminId;
        this.refresh();
      }, error => {
        console.error('Error in subscription:', error);
        // Handle the error as needed, e.g., show a user-friendly message
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  public refresh(): void {
  if(this.adminId==='hosp1admin') {
    this.technicianRecords$ = this.technicianService.getTechniciansByHospitalId(1);
    }
    else if(this.adminId==='hosp2admin') {
     this.technicianRecords$ = this.technicianService.getTechniciansByHospitalId(2);
    }
    else {
     this.technicianRecords$ = this.technicianService.getTechniciansByHospitalId(3);
    }
  }
}
