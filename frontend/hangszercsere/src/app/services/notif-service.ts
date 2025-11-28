import { Injectable } from '@angular/core';
import { Notification } from '../components/notification/notification';
@Injectable({
  providedIn: 'root'
})
export class NotifService {
  private notificationComponent!: Notification;

  // Register the notification component once
  register(notificationComponent: Notification) {
    this.notificationComponent = notificationComponent;
  }

  // Show notification anywhere
  show(type: 'success' | 'error', message: string, duration: number = 3000) {
    if (!this.notificationComponent) return;
    this.notificationComponent.show(type, message, duration);
  }
}