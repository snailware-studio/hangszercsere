import { Component } from '@angular/core';
import { NotifService } from '../../services/notif-service/notif-service';

@Component({
  selector: 'app-notif-component',
  standalone: false,
  templateUrl: './notif-component.html',
  styleUrl: './notif-component.css'
})
export class NotifComponent {
  visible = false;
  message = '';
  type: 'success' | 'error' | 'message' | 'warning' = 'success';

  constructor(private notifService: NotifService) { 
    this.notifService.register(this);
  }

  show(type: 'success' | 'error' | 'message' | 'warning', message: string, duration: number = 3000) {
    this.visible = false;
    this.type = type;
    this.message = message;
    this.visible = true;

    if (duration > 0) {
      setTimeout(() => {
        this.visible = false;
      }, duration);
    }

  }

  test(message: string) {
    alert(message);
  }
}
