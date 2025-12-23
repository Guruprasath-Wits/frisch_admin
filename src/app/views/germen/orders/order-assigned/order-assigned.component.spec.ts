import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderAssignedComponent } from './order-assigned.component';

describe('OrderAssignedComponent', () => {
  let component: OrderAssignedComponent;
  let fixture: ComponentFixture<OrderAssignedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderAssignedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderAssignedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
