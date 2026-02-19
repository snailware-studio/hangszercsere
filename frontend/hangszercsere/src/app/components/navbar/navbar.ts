import { Component,OnInit } from '@angular/core';
import { UserService } from '../../services/user-service/user-service';
import { NavigationEnd, Router } from '@angular/router';
import { GlobalService } from '../../services/GlobalService/global-service';
import { CartService } from '../../services/cart-service/cart-service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

  constructor(
    private userService: UserService,
    private router: Router,
    private global: GlobalService,
    private cart: CartService
  ){
    this.rootUrl = this.global.rootUrl;
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.isMobileRoute = e.urlAfterRedirects.startsWith('/mobile');
      });
  }

  rootUrl: string;
  isMobileRoute = false;



  ngOnInit() {

    const isDark = localStorage.getItem('darkMode');
    if (isDark == 'true') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  GotoProfile(id: number) {
    this.router.navigate(['/profile', id]);
  }

  dropdown = false;

  toggleDropdown() {
    this.dropdown = !this.dropdown;
  }

  isLoggedIn(): boolean
  {
    return this.userService.isLoggedIn();
    
  }

  LogOut(): void
  {
    this.userService.LogOut();
  }

  toggleDarkMode() {
    const html = document.documentElement;
    html.classList.toggle('dark');

    //save
    const isDark = html.classList.contains('dark');
    localStorage.setItem('darkMode', isDark.toString());
  }

menu: 'none' | 'login' | 'register' = 'none';

openMenu(type: 'login' | 'register') {
  if (this.menu === type) {
    this.menu = 'none';
    setTimeout(() => this.menu = type, 0);
  } else {
    this.menu = type;
  }
}

closeMenu() {
  this.menu = 'none';
}
}
