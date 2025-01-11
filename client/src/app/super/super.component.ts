import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import { Observable, Subscription } from 'rxjs';

import { RoleEnum } from '../utils';
import { AuthService } from '../core/auth/auth.service';

import { SuperViewRecord } from './super';
import { SuperService } from './super.service';


@Component({
  selector: 'app-super',
  templateUrl: './super.component.html',
  styleUrls: ['./super.component.scss']
})
export class SuperComponent implements OnInit, OnDestroy {
  public superId: any;
  public superRecordObs?: Observable<SuperViewRecord>;
  private sub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly superService: SuperService,
    private readonly authService: AuthService
  ) { }

  ngOnInit(): void {
    this.sub = this.route.params
      .subscribe((params: Params) => {
        this.superId = params.superId;
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  public refresh(): void {
    this.superRecordObs = this.superService.getSuperByHospitalId(this.authService.getHospitalId(), this.superId);
  }

  public isSuper(): boolean {
    return this.authService.getRole() === RoleEnum.SUPER;
  }
}
