import { Injectable } from '@angular/core';
import { Filters } from '../../components/filter/filter';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  //SERVICE FOR GLOBAL VARIABLES / FUNCTIONS !!

  rootUrl = "https://hangszercsere.hu";
  apiUrl = "https://hangszercsere.hu/api/";

  //set to 1/true if you want to use localhost as the api
  public dev = 1;
  public show_cookie = true; // default true, and when users clicks ok then false
  
  public filters: Filters = {
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

  constructor() {
    if (this.dev)
    {
      this.rootUrl = "http://localhost:3000";
      this.apiUrl = "http://localhost:3000/api/";
    }
    else
    {
      this.apiUrl = "https://hangszercsere.hu/api/";
      this.rootUrl = "https://hangszercsere.hu";
    }
  }
}
