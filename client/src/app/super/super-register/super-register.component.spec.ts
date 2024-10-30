import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperRegisterComponent } from './super-register.component';

describe('SuperNewComponent', () => {
  let component: SuperRegisterComponent;
  let fixture: ComponentFixture<SuperRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperRegisterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
