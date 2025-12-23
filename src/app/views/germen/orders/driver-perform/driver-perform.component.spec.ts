import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverPerformComponent } from './driver-perform.component';

describe('DriverPerformComponent', () => {
  let component: DriverPerformComponent;
  let fixture: ComponentFixture<DriverPerformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverPerformComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverPerformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
