import { Component } from '@angular/core';
import { NotifService } from '../../services/notif-service';

@Component({
  selector: 'app-notification',
  standalone: false,
  templateUrl: './notification.html',
  styleUrl: './notification.css'
})

export class Notification {
  visible = false;
  message = '';
  type: 'success' | 'error' = 'success';

  constructor(private notifService: NotifService) {}

  ngOnInit(): void {
    // Register this component with the service
    this.notifService.register(this);
  }

  show(type: 'success' | 'error', message: string, duration: number = 3000) {
    this.type = type;
    this.message = message;
    this.visible = true;

    setTimeout(() => {
      this.visible = false;
    }, duration);
  }
}
