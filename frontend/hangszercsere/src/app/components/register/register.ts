import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserService,user } from '../../services/user-service/user-service';
import { Route, UrlSegment } from '@angular/router';
import { Router } from '@angular/router';
import { NotifService } from '../../services/notif-service/notif-service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  @Input() isMenu: boolean = false;
  @Input() show: boolean = true;   
  @Output() closed = new EventEmitter<void>(); 

  constructor(
    private userservice: UserService,
    private router: Router,
    private NotifService: NotifService
  ) {};

  name:string = '';
  email:string = '';
  location: string = '';
  password:string = '';

  ngOnInit(): void
  {
    if (this.userservice.isLoggedIn())
    {
      this.NotifService.show('error',"You are already logged in!");
      this.router.navigate(['/'])
    }
  }

  RegisterUser(): void
  {
    const newUser: user = 
    {
      id: 0,
      name: this.name,
      email: this.email,
      location: this.location,
      password: this.password
    };
      this.userservice.RegisterUser(newUser).subscribe({
        next: (res) => {
          console.log('Registration successful', res);
          alert('Registration successful! 🎉');
          this.name = '';
          this.email = '';
          this.password = '';
          
          if(this.isMenu)
          {
            this.show = false;
          }
          else{
             this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          console.error('Registration failed', err);
          alert('Registration failed: ' + (err.error?.error || 'Unknown error'));
        }});
  }

    closeMenu() {
    this.show = false;
    this.closed.emit();
  }

}
