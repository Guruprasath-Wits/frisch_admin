import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAdvantagesComponent } from './user-advantages.component';

describe('UserAdvantagesComponent', () => {
  let component: UserAdvantagesComponent;
  let fixture: ComponentFixture<UserAdvantagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAdvantagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAdvantagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
