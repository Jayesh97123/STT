import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Stt } from './stt';

describe('Stt', () => {
  let component: Stt;
  let fixture: ComponentFixture<Stt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stt],
    }).compileComponents();

    fixture = TestBed.createComponent(Stt);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
