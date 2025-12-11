import { Injectable } from '@angular/core';
import { NotifComponent } from '../../components/notif-component/notif-component';

@Injectable({
  providedIn: 'root'
})
export class NotifService {
  private notifComponent: NotifComponent | null = null;

  register(component: NotifComponent) {
    this.notifComponent = component;
  }

  show(type: 'success' | 'error' | 'message' | 'warning', message: string,button1: string = '', button2: string = '', duration: number = 3000) { 
    if (this.notifComponent) {
      this.notifComponent.show(type, message, button1, button2);
    } else {
      console.warn('NotifComponent not registered!');
    }
  }
}
