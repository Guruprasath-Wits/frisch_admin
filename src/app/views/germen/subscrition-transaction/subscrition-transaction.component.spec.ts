import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscritionTransactionComponent } from './subscrition-transaction.component';

describe('SubscritionTransactionComponent', () => {
  let component: SubscritionTransactionComponent;
  let fixture: ComponentFixture<SubscritionTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscritionTransactionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscritionTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
