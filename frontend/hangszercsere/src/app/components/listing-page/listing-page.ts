import { Component, input, OnInit } from '@angular/core';
import { ListingService,Listing } from '../../services/listing-service/listing-service';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat-service/chat-service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user-service/user-service';
import { CartService } from '../../services/cart-service/cart-service';
import { NotifService } from '../../services/notif-service/notif-service';
import { GlobalService } from '../../services/GlobalService/global-service';

@Component({
  selector: 'app-listing-page',
  standalone: false,
  templateUrl: './listing-page.html',
  styleUrl: './listing-page.css'
})
export class ListingPage {
  public listing: Listing;
  constructor(
    private listingService: ListingService,
    private route: ActivatedRoute,
    private ChatService: ChatService,
    private router: Router,
    private user: UserService,
    private cart: CartService,
    private NotifService: NotifService,
    private global: GlobalService
  ) {
    
    this.rootUrl = this.global.rootUrl;

   }

   rootUrl: string;

  GotoProfile(id: number) {
    this.router.navigate(['/profile', id]);
  }

  EditListing(id: number) {
    this.router.navigate(['/listing/edit', id]);
  }

  AddToCart(listing_id: number): void {
    if (!this.user.isLoggedIn()) {
      this.NotifService.show('error',"You must be logged in!");
      this.router.navigate(['/login']);
      return;
    }

    this.cart.AddToCart(listing_id);
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('getting listing with id:', id);

    this.listingService.getListingById(id).subscribe(data => {
      this.listing = data;
      console.log('listing loaded:', this.listing);
    });
  }


  RemoveListing(id: number): void {
    this.listingService.RemoveListing(id).subscribe({
      next: (res) => {
        this.NotifService.show('success',"Removed listing.");
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.NotifService.show('error',"Failed to remove listing.");
        console.error('failed to remove', err);
      }
    });

  }

  GetUserId(): number {
    return this.user.currentUserId;
  }

  StartChat(listing: Listing) {
    if (!this.user.isLoggedIn()) {
      this.NotifService.show('error',"You must be logged in!");
      this.router.navigate(['/login']);
      return
    }
    this.ChatService.current_listing = listing;

    this.router.navigate(['/chat']);
  }
}

