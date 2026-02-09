import { Component,OnInit } from '@angular/core';
import { Listing } from '../../services/listing-service/listing-service';
import { ListingService } from '../../services/listing-service/listing-service';
import { UserService } from '../../services/user-service/user-service';
import { GlobalService } from '../../services/GlobalService/global-service';

@Component({
  selector: 'app-admin-panel',
  standalone: false,
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css'
})
export class AdminPanel {

  listings: Listing[] = [];

  constructor(
    public userservice: UserService,
    private listingservice: ListingService,
    private global: GlobalService
  ){

  }
  ngOnInit():void
  {
    this.listingservice.GetListingsAdmin().subscribe((Data) => (this.listings = Data));
  }

  RemoveListing(id:number): void
  {
    this.listingservice.RemoveListing(id).subscribe({
      next: (res) => {
          alert('Removed');
          this.listings = this.listings.filter(listing => listing.id !== id);
        },
        error: (err) => {
          alert('failed to remove');
          console.error('failed to remove', err);
        }});

  }
}
