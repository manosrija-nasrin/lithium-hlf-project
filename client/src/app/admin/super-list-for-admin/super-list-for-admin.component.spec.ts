import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperListForAdminComponent } from './super-list-for-admin.component';

describe('SuperListForAdminComponent', () => {
  let component: SuperListForAdminComponent;
  let fixture: ComponentFixture<SuperListForAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SuperListForAdminComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperListForAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
