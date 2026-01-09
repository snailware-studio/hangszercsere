import { Component,OnInit } from '@angular/core';
import { UserService } from '../../services/user-service/user-service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { GlobalService } from '../../services/GlobalService/global-service';

@Component({
  selector: 'app-profile-page',
  standalone: false,
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css'
})
export class ProfilePage {

user: any = null;

constructor(
  private userService: UserService,
  private route: ActivatedRoute,
  private router: Router,
  private global: GlobalService
){
  this.rootUrl = this.global.rootUrl;
}

rootUrl: string;

ngOnInit(): void {

  this.userService.GetUser(Number(this.route.snapshot.paramMap.get('id'))).subscribe(data =>
  {
    this.user = data;
  });
}

CurrentUserId(): number {
  return this.userService.getUserId();
}

  EditProfile() {
    const id = this.user.id;
    this.router.navigate(['/profile/edit', id]);
  }

}
