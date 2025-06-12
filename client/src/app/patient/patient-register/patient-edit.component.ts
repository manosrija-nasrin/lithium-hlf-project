import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { RoleEnum } from '../../utils';
import { PatientRecord } from '../patient';
import { PatientService } from '../patient.service';

@Component({
  selector: 'app-patient-new',
  templateUrl: './patient-edit.component.html',
  styleUrls: ['./patient-edit.component.scss']
})
export class PatientEditComponent implements OnInit, OnDestroy {
  public form: FormGroup;
  public error: any = null;
  public title = '';
  public healthId: any;
  public newPatientData: any;
  private allSub = new Subscription();

  public bloodGroupTypes = [
    { id: 'A+', name: 'A +' },
    { id: 'A-', name: 'A -' },
    { id: 'B+', name: 'B +' },
    { id: 'B-', name: 'B -' },
    { id: 'AB+', name: 'AB +' },
    { id: 'AB-', name: 'AB -' },
    { id: 'O+', name: 'O +' },
    { id: 'O-', name: 'O -' }
  ];

  public sexCategories = [
    { id: 'M', name: 'Male' },
    { id: 'F', name: 'Female' },
    { id: 'T', name: 'Transgender' }
  ]

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly patientService: PatientService,
    private readonly authService: AuthService
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      address: ['', Validators.required],
      dob: ['', [Validators.required]],
      phoneNumber: ['', Validators.required],
      aadhar: ['', Validators.required],
      bloodGroup: ['', Validators.required],
      sex: ['', Validators.required],
      alert: [''],
      isDiseased: [''],
      healthCreditPoints: [''],
      deferralStatus: [''],
      donationHistory: ['']
    });
  }

  ngOnInit(): void {
    this.allSub.add(
      this.route.params.subscribe((params: Params) => {
        this.healthId = params.self;
        this.refresh();
      })
    );
  }

  public isEditForm(): boolean {
    return !this.isNew();
  }

  ngOnDestroy(): void {
    this.allSub.unsubscribe();
  }

  public refresh(): void {
    this.setTitle();
    if (this.isNew()) {
      this.form.reset();
    }
    else {
      this.allSub.add(
        this.patientService.getPatientByKey(this.healthId).subscribe(x => {
          const data = x as PatientRecord;
          this.loadRecord(data);
        })
      );
    }
    this.error = null;
  }

  public isNew(): boolean {
    return this.healthId === 'new';
  }

  public isPatient(): boolean {
    return this.authService.getRole() === RoleEnum.PATIENT;
  }

  public isDoctor(): boolean {
    return this.authService.getRole() === RoleEnum.DOCTOR;
  }

  public getAdminUsername(): string {
    return this.authService.getUsername();
  }

  public save(): void {
    if (this.isNew()) {
      this.allSub.add(
        this.patientService.createPatient(this.form.value).subscribe(x => this.newPatientData = x)
      );
    }
    else if (this.isPatient()) {
      this.allSub.add(
        this.patientService.updatePatientPersonalDetails(this.healthId, this.form.value).subscribe(x => {
          const response = x;
          if (response.error) {
            this.error = response.error;
          }
          this.router.navigate(['/', 'patient', this.healthId]);
        })
      );
    }
    else {
      this.allSub.add(
        this.patientService.updatePatientMedicalDetails(this.healthId, this.form.value).subscribe(x => {
          const response = x;
          if (response.error) {
            this.error = response.error;
          }
          this.router.navigate(['/', 'patient', this.healthId]);
        })
      );
    }
  }

  public findInvalidControls(): void {
    const invalid = [];
    const controls = this.form.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    console.log(invalid);
  }

  public reset(): void {
    this.newPatientData = null;
    this.router.navigate(['/', 'admin', this.getAdminUsername()]);
  }

  public toggleAlert(): void {
    if (this.isDoctor() && !this.isNew()) {
      const currentValue = this.form.get('alert')!.value;
      this.form.get('alert')!.setValue(currentValue === 'true' ? 'false' : 'true');
    }
  }

  public toggleIsDiseased(): void {
    if (this.isDoctor() && !this.isNew()) {
      const currentValue = this.form.get('isDiseased')!.value;
      this.form.get('isDiseased')!.setValue(currentValue === 'true' ? 'false' : 'true');
    }
  }


  private setTitle(): void {
    this.title = (this.isNew() ? 'Create' : 'Edit') + ' Patient';
  }

  private loadRecord(record: PatientRecord): void {
    this.clearValidators();
    if (this.isPatient()) {
      this.form.patchValue({
        firstName: record.firstName,
        lastName: record.lastName,
        address: record.address,
        dob: record.dob,
        phoneNumber: record.phoneNumber,
        aadhar: record.aadhar,
        sex: record.sex,
      });
    }
    else {
      this.form.patchValue({
        alert: record.alert,
        isDiseased: record.isDiseased,
        healthCreditPoints: record.healthCreditPoints,
        deferralStatus: record.deferralStatus,
        donationHistory: record.donationHistory
      });
    }
  }

  private clearValidators(): void {
    for (const key in this.form.controls) {
      this.form.get(key)?.clearValidators();
      this.form.get(key)?.updateValueAndValidity();
    }
  }
}
