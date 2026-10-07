import { Component, computed, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { TaskStore } from '../../services/task-store.service';
import { statusLabel } from '../task-status';
import { RouterLink } from '@angular/router';
import { AttachmentsService } from '../../services/attachments';

@Component({
  imports: [RouterLink],
  selector: 'app-task-detail',
  styleUrl: './task-detail.css',
  templateUrl: './task-detail.html',
})
export class TaskDetail {
  private readonly store = inject(TaskStore);
  private readonly attachmentsService = inject(AttachmentsService);
  readonly attachments = signal<{ name: string; url: string }[]>([]);
  readonly attachmentError = signal(false);
  
  taskId = input.required({transform:numberAttribute});
  task = computed( () => this.store.tasks().find(t => t.id === this.taskId()));

  constructor() {
    effect(() => {
      const id = this.taskId();
      this.attachments.set([]);
      this.attachmentError.set(false);
      void this.loadAttachments(id);
    });
  }

  private async loadAttachments(taskId: number): Promise<void> {
    try {
      this.attachments.set(await this.attachmentsService.list(taskId));
    } catch {
      this.attachmentError.set(true);
    }
  }
  
  label = statusLabel;


}
