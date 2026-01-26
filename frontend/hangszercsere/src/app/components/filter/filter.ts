import { Component } from '@angular/core';
import { ListingService } from '../../services/listing-service/listing-service';
import { HomePage } from '../home-page/home-page';
import { GlobalService } from '../../services/GlobalService/global-service';

@Component({
  selector: 'app-filter',
  standalone: false,
  templateUrl: './filter.html',
  styleUrl: './filter.css'
})
export class Filter {
  constructor(
    private ListingService: ListingService,
    private HomePage: HomePage,
    private global: GlobalService
  ) {}

  ngOnInit(): void {
    this.GetCategories();
  }

  showExtra = false;

  categories: any[] = [];

  filters: Filters = {
    category: null,
    priceType: null,     // 'less', 'more', 'custom'
    priceValue: null,  // For less/more
    priceMin: null,    // Custom range min
    priceMax: null,    // Custom range max
    condition: null,
    brand: null,
    model: null,
    location: null,
    aiRating: null,
    dateType: null,      // 'before' or 'after'
    dateValue: null      // Actual date
  };

  GetCategories() {
    this.ListingService.GetCategories().subscribe({
      next: (res) => {
       this.categories = res;
      },
      error: (err) => {
        console.error('Hiba', err);
      }
    });
  }

  FilterListings() {
    this.global.filters = this.filters;
    this.HomePage.GetListings();
  }
}

export interface Filters {
  category: string;
  priceType: string;     // 'less', 'more', 'custom'
  priceValue: number;    // For less/more
  priceMin: number;      // Custom range min
  priceMax: number;      // Custom range max
  condition: string;
  brand: string;
  model: string;
  location: string;
  aiRating: number;
  dateType: string;      // 'before' or 'after'
  dateValue: string;     // Actual date
}
