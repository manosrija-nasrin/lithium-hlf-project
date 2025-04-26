import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeferredDonorListForSuperComponent } from './deferred-donor-list-for-super.component';

describe('DeferredDonorListForSuperComponent', () => {
  let component: DeferredDonorListForSuperComponent;
  let fixture: ComponentFixture<DeferredDonorListForSuperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeferredDonorListForSuperComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeferredDonorListForSuperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
