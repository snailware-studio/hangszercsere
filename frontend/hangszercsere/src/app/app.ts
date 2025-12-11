import { Component, signal } from '@angular/core';
import { WSservice } from './services/WSservice/wsservice';
import { NotifService } from './services/notif-service/notif-service';
import { UserService } from './services/user-service/user-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('hangszercsere');

  constructor(private ws: WSservice,
    private notif: NotifService,
    private user: UserService
  ) {
  }

  ngOnInit(): void {
    this.ws.message.subscribe(data => {
      const message = JSON.parse(data);
      if(message?.action == 'message' && message.user != this.user.currentUserId)
      {
        this.notif.show("message", `New message!`);
      }
    });
  }

  menu: 'none' | 'login' | 'register' = 'none';

  openMenu(type: 'login' | 'register') {
    this.menu = type;
  }

  closeMenu() {
    this.menu = 'none';
  }

}
