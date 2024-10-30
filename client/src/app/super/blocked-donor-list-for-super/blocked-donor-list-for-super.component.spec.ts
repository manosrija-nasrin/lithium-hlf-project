import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockedDonorListForSuperComponent } from './blocked-donor-list-for-super.component';

describe('BlockedDonorListForSuperComponent', () => {
  let component: BlockedDonorListForSuperComponent;
  let fixture: ComponentFixture<BlockedDonorListForSuperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlockedDonorListForSuperComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockedDonorListForSuperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
