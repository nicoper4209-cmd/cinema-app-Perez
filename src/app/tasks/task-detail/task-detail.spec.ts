import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AttachmentsService } from '../../services/attachments';
import { TaskDetail } from './task-detail';

describe('TaskDetail', () => {
  let component: TaskDetail;
  let fixture: ComponentFixture<TaskDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetail],
      providers: [
        provideRouter([]),
        {
          provide: AttachmentsService,
          useValue: { list: vi.fn().mockResolvedValue([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDetail);
    fixture.componentRef.setInput('taskId', 1);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
