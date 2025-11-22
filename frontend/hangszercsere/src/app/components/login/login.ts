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

  ngOnInit(): void
  {
    if (this.userService.isLoggedIn())
    {
      this.router.navigate(['/'])
    }
  }

  LoginUser()
  { 
    this.userService.LoginUser(this.name,this.password).subscribe({

      next: (res: any) => {
            this.NotifService.show('success',"Login successful!");
            this.userService.setUser(res.id,res.name);
            this.router.navigate(['/']);
            if (this.isMenu) this.closeMenu();
          },
          error: (err) => {
            let msg = "Unkown error"; // translation: it's cooked
            if (err && err.error && err.error.error) {
              msg = err.error.error;
            }
            alert(msg);
          }
        });
  }

    closeMenu() {
    this.show = false;
    this.closed.emit();
  }

}
