import { Component } from '@angular/core';
import { GlobalService } from '../../services/GlobalService/global-service';

@Component({
  selector: 'app-cookie-banner',
  standalone: false,
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.css'
})
export class CookieBanner {
  token = localStorage.getItem('cookie');
  visible = false;
  
  message = 'This site uses cookies, by using the website you agree to our use of cookies.';

  constructor(private globalService: GlobalService) {
    if (this.token != "ok")
    {
      console.log(this.token);
      this.visible = this.globalService.show_cookie;
    }
  }

  public cookie_ok()
  {
    this.globalService.show_cookie = false;
    this.visible = false;
    localStorage.setItem("cookie", "ok");
  }
}
