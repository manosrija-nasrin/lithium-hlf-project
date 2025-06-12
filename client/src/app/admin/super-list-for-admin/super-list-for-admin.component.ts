import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { DisplayVal } from '../../patient/patient';
import { SuperViewRecord } from '../../super/super';
import { SuperService } from '../../super/super.service';

@Component({
  selector: 'app-super-list-for-admin',
  templateUrl: './super-list-for-admin.component.html',
  styleUrls: ['./super-list-for-admin.component.scss']
})
export class SuperListForAdminComponent implements OnInit, OnDestroy {
  public adminId: any;
  public superRecords$?: Observable<Array<SuperViewRecord>>;
  private sub?: Subscription;
  public headerNames = [
    new DisplayVal(SuperViewRecord.prototype.registration, 'Registration'),
    new DisplayVal(SuperViewRecord.prototype.fullName, 'Full Name'),
    new DisplayVal(SuperViewRecord.prototype.address, 'Address'),
    new DisplayVal(SuperViewRecord.prototype.phoneNumber, 'Phone Number'),
    new DisplayVal(SuperViewRecord.prototype.emergPhoneNumber, 'Emergency Phone Number')
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly superService: SuperService,
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
      this.superRecords$ = this.superService.getSupersByHospitalId(1);
    } else if (this.adminId === 'hosp2admin') {
      this.superRecords$ = this.superService.getSupersByHospitalId(2);
    } else {
      this.superRecords$ = this.superService.getSupersByHospitalId(3);
    }
  }
}
