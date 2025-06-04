import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientListForAdminComponent } from './patient-list-for-admin.component';

describe('PatientListForAdminComponent', () => {
  let component: PatientListForAdminComponent;
  let fixture: ComponentFixture<PatientListForAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientListForAdminComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientListForAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
