import { Component } from '@angular/core';
import { ListingService,Listing } from '../../services/listing-service/listing-service';
import { GlobalService } from '../../services/GlobalService/global-service';
import { NotifService } from '../../services/notif-service/notif-service';
import { UserService } from '../../services/user-service/user-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mylistings-component',
  standalone: false,
  templateUrl: './mylistings-component.html',
  styleUrl: './mylistings-component.css'
})
export class MylistingsComponent {

  constructor(
    private listingService: ListingService,
    private global: GlobalService,
    private notif: NotifService,
    public user: UserService,
    private router: Router
  ) {
    this.rootUrl = this.global.rootUrl;
  }

  rootUrl: string = 'https://hangszercsere.hu';

  listings: any[] = [];

  LoadListings(): void {
    this.listingService.MyListings().subscribe(data => {
      this.listings = data;
      console.log('listings loaded:', this.listings);
    });
  }

  editListing(id: number): void {
    this.router.navigate(['/listing/edit', id]);
  }

  goTo(id: number): void {
    this.router.navigate(['/listing', id]);
  }

  ngOnInit(): void {
    this.LoadListings();
  }

}
