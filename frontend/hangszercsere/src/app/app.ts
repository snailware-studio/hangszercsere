import { Component, signal } from '@angular/core';
import { WSservice } from './services/WSservice/wsservice';
import { NotifService } from './services/notif-service/notif-service';
import { UserService } from './services/user-service/user-service';
import { PopupService } from './services/popup-service/popup-service';
import { CartService } from './services/cart-service/cart-service';

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
    private user: UserService,
    private popup: PopupService,
    private cart: CartService
  ) {
  }

  ngOnInit(): void {
   // this.popup.Show('test', {close: () => this.popup.close()});

    this.ws.message.subscribe(data => {
      const message = JSON.parse(data);
      if (message?.action == 'message' && message.user != this.user.currentUserId) {
        this.notif.show("message", `New message!`);
      }
    });

   
  }


}
