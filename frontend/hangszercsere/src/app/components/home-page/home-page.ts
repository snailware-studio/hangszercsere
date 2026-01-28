import { Component } from '@angular/core';
import { ListingService,Listing } from '../../services/listing-service/listing-service';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart-service/cart-service';
import { UserService } from '../../services/user-service/user-service';
import { Filter } from '../filter/filter';
import { NotifService } from '../../services/notif-service/notif-service';
import { th } from 'date-fns/locale';
import { GlobalService } from '../../services/GlobalService/global-service';

@Component({
  selector: 'app-home-page',
  standalone: false,
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage {
  public listings: Listing[] = [];
  public storedListings: Listing[] = [];

  constructor(
    private ListingService: ListingService,
    private router: Router,
    private cart: CartService,
    private user: UserService,
    private NotifService: NotifService,
    private global: GlobalService
  ) {
    this.rootUrl = this.global.rootUrl;
  }

  rootUrl: string;

  viewListing(id: number) {
    this.router.navigate(['/listing', id]);
  }

  SetListing(data:Listing): void
  {
  this.ListingService.SetListing(data);
  }

  AddToCart(listing_id: number): void
  {
    if (!this.user.isLoggedIn())  {
     alert("You must be logged in!");
     this.router.navigate(['/login']);
    return;
  }

    this.cart.AddToCart(listing_id);
  }

 GetListings(): void {
  this.ListingService.GetListings().subscribe((Data) => {
    this.listings = Data;
    this.storedListings = Data;

    if (this.listings.length === 0) {
      this.listings = null;
    }
  });
}


  ngOnInit(): void {
    this.GetListings();
  }
}