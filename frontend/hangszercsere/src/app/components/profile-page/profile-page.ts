import { Component,OnInit } from '@angular/core';
import { UserService } from '../../services/user-service/user-service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { GlobalService } from '../../services/GlobalService/global-service';
import { ListingService } from '../../services/listing-service/listing-service';

@Component({
  selector: 'app-profile-page',
  standalone: false,
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css'
})
export class ProfilePage {

user: any = null;
listings: any[] = [];

constructor(
  private userService: UserService,
  private route: ActivatedRoute,
  private router: Router,
  private global: GlobalService,
  public listingService: ListingService
){
  this.rootUrl = this.global.rootUrl;
}

rootUrl: string;
carouselIndex = 0;

ngOnInit(): void {

  this.userService.GetUser(Number(this.route.snapshot.paramMap.get('id'))).subscribe(data =>
  {
    this.user = data;
  });

    
    this.listingService.ListingByUserId(Number(this.route.snapshot.paramMap.get('id'))).subscribe(data =>
    {
      this.listings = data;
      
      console.log('listings loaded:', this.listings);
    });
}

OpenListing(listing: any) {
  this.router.navigate(['/listing', listing.id]);
}

CurrentUserId(): number {
  return this.userService.getUserId();
}

  EditProfile() {
    const id = this.user.id;
    this.router.navigate(['/profile/edit', id]);
  }

}
