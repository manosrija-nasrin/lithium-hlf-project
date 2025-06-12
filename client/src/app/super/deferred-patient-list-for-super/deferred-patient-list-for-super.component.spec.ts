import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeferredPatientListForSuperComponent } from './deferred-patient-list-for-super.component';

describe('DeferredPatientListForSuperComponent', () => {
  let component: DeferredPatientListForSuperComponent;
  let fixture: ComponentFixture<DeferredPatientListForSuperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeferredPatientListForSuperComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeferredPatientListForSuperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
