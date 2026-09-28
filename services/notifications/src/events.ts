export enum NotificationEventType {
  ENROLLMENT_CREATED = 'enrollment_created',
  ASSIGNMENT_CREATED = 'assignment_created',
  ASSIGNMENT_DEADLINE = 'assignment_deadline',
  SUBMISSION_RECEIVED = 'submission_received',
  GRADING_COMPLETED = 'grading_completed',
  ASSESSMENT_RESULT = 'assessment_result',
  COURSE_PUBLISHED = 'course_published',
}

export interface NotificationEvent {
  type: NotificationEventType;
  userId: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
}

export type EventHandler = (event: NotificationEvent) => Promise<void>;

export class EventBus {
  private handlers: Map<NotificationEventType, EventHandler[]> = new Map();

  subscribe(eventType: NotificationEventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  unsubscribe(eventType: NotificationEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  async publish(event: NotificationEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }
}

export const eventBus = new EventBus();
