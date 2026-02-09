import { Component } from '@angular/core';
import { ListingService } from '../../services/listing-service/listing-service';
import {GlobalService} from '../../services/GlobalService/global-service';

@Component({
  selector: 'app-history-component',
  standalone: false,
  templateUrl: './history-component.html',
  styleUrl: './history-component.css'
})
export class HistoryComponent {

  groupedHistory: { date: string; items: any[] }[] = [];

  constructor(private listingService: ListingService,
    private global: GlobalService
  ) {
    this.loadHistory();
     this.rootUrl = this.global.rootUrl;
  }

  loadHistory() {
  this.listingService.getPurchaseHistory().subscribe((res: any) => {
   this.groupHistory(res);
  });
}

rootUrl: string;

groupHistory(history: any[]): void {
//sort the listings by date (DAY accuracy)
  history.forEach(listing => {
    if (this.groupedHistory.find(item => item.date === listing.created_at.split(' ')[0])) {
      this.groupedHistory.find(item => item.date === listing.created_at.split(' ')[0]).items.push(listing);
    } else {
      this.groupedHistory.push({
        date: listing.created_at.split(' ')[0],
        items: [listing]
      });
    }
  });
  this.groupedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

}
  
}
