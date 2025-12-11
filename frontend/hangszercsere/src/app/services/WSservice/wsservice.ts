import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserService } from '../user-service/user-service';
import { GlobalService } from '../GlobalService/global-service';

@Injectable({
  providedIn: 'root'
})
export class WSservice {
  private socket: WebSocket;
  private messagesubject: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(private user: UserService,
    private global: GlobalService
  ) {
    console.log('=== wsservice started ===');

    if (this.global.dev) {
      this.socket = new WebSocket('ws://localhost:3000');
    }
    else {
      this.socket = new WebSocket('wss://hangszercsere.hu');
    }



    this.socket.onopen = () => {

      if (!this.user.isLoggedIn()) {
        return;
      }
      console.log('ws-service: connected');
      this.socket.send(JSON.stringify({ action: 'register', userID: this.user.getUserId() }));
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(`ws-service: ${JSON.stringify(data)}`);
      this.messagesubject.next(event.data);
      if (data.action === 'message') {

      }
    };

    this.socket.onclose = () => {
      console.log('ws-service: disconnected');
    };

    this.socket.onerror = (error) => {
      console.log('ws-service: error', error);
    };

  }
  public message = this.messagesubject.asObservable();

  public sendMessage(userID: number, toUserID: number, message: string, listing: number) {
    console.log(`ws-service: sending message to ${userID}`);
    if (this.socket.readyState === WebSocket.OPEN) {
      const msg = {
        action: 'message',
        userID,
        toUserID,
        message,
        listing
      };
      this.socket.send(JSON.stringify(msg));
    }
  }

}
