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
  type: 'success' | 'error' = 'success';

  constructor(private notifService: NotifService) {
    // register this component instance in the service
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

  test(message: string) {
    alert(message);
  }
}
