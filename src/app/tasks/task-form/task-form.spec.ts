import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TaskForm } from './task-form';

describe('TaskForm', () => {
  let component: TaskForm;
  let fixture: ComponentFixture<TaskForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskForm],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not assign an ID when creating a new task', () => {
    expect(component.taskId()).toBeUndefined();
  });

  it('should provide a file input for attachments', () => {
    fixture.detectChanges();
    const fileInput = fixture.nativeElement.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
  });
});
