import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserService } from '../../services/user-service/user-service';
import { Router } from '@angular/router';
import { NotifService } from '../../services/notif-service/notif-service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  @Input() isMenu: boolean = false;
  @Input() show: boolean = true;   
  @Output() closed = new EventEmitter<void>(); 

  constructor(
    private userService: UserService,
    private router: Router,
    private NotifService: NotifService
  ) {};

  name: string = '';
  password: string = '';
  alertmsg: string = '';
  disabled: boolean = false;

  ngOnInit(): void
  {
    if (this.userService.isLoggedIn())
    {
      this.NotifService.show('error',"Már be vagy jelentkezve!");
      this.router.navigate(['/'])
    }
  }

  LoginUser()
  { 
    this.userService.LoginUser(this.name,this.password).subscribe({

      next: (res: any) => {
            this.NotifService.show('success',"Sikeres bejelentkezés!");
            this.router.navigate(['/']);
            if (this.isMenu) this.closeMenu();
          },
          error: (err) => {
            let msg = "Ismeretlen hiba"; // translation: it's cooked
            if (err && err.error && err.error.error) {
              msg = err.error.error;
            }
            if(msg == 'Email nincs megerősítve!')
            {
              this.NotifService.show('warning',"Erősítsd meg az email címed!");
              return;
            }
            this.alertmsg = msg;
          }
        });
  }

    closeMenu() {
    this.show = false;
    this.closed.emit();
  }

}
