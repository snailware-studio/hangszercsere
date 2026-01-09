import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Timestamp, of, tap } from 'rxjs';
import { Filters } from '../../components/filter/filter';
import { GlobalService } from '../GlobalService/global-service';

@Injectable({
  providedIn: 'root',
})

export class ListingService {
  private apiUrl = 'https://hangszercsere.hu/api/instruments';

  constructor(private http: HttpClient,
    private global: GlobalService
  ) {
    this.apiUrl = this.global.apiUrl + 'instruments';
  }

  private cachedListing: Listing;
  filters: Filters;

  //eltárolja a listinget amire rányomtunk
  SetListing(data: Listing) {
    this.cachedListing = data;
  }
  //---- ha már el van tárolva csak visszaadja ha nem akkor sql query. minden page reload = sql query!!! scary
  //visszaadaja
  getListingById(id: number): Observable<Listing> {
    if (this.cachedListing?.id === id) {
      return of(this.cachedListing);
    }
    else {
      
      return this.http.get<Listing>(`${this.apiUrl.substring(0, this.apiUrl.length - 1)}/${id}`, {
        withCredentials: true 
      }).pipe(tap(data => this.cachedListing = data));
    }
  };

  GetListings(): Observable<any> {
    return this.http.get(this.apiUrl, {
      withCredentials: true 
    });
  }

  AddListing(listing: Listing): Observable<any> {
    return this.http.post(this.apiUrl, listing, {
      withCredentials: true  
    });
  }

  RemoveListing(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      withCredentials: true  
    });
  }

  UpdateListing(listing: Listing): Observable<any> {

    const newlisting = {
      title: listing.title,
      price: listing.price,
      description: listing.description,
      status: listing.status,
      user_id: listing.user_id,
      category_id: listing.category_id,
      brand: listing.brand,
      model: listing.model,
      condition: listing.condition,
      ai_rating: listing.ai_rating,
      ai_reviewed: false,
      ai_feedback: null
    };

    return this.http.put(`${this.apiUrl.substring(0, this.apiUrl.length - 1)}/update/${listing.id}`, newlisting, {
      withCredentials: true  
    });
  }

  AddMedia(images: File[] | null, videos: File[] | null, listingId: number): Observable<any> {
    const formData = new FormData();

    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
    }

    if (videos) {
      for (let i = 0; i < videos.length; i++) {
        formData.append('videos', videos[i]);
      }
    }

    formData.append('listingId', listingId.toString());

    return this.http.post(`${this.apiUrl}/media`, formData, {
      reportProgress: true,
      observe: 'events',
      withCredentials: true 
    });
  }

  updateMedia(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/media/update`, formData, {
      reportProgress: true,
      observe: 'events',
      withCredentials: true 
    });
  }

  UploadFilters(filters: Filters): void {
    this.filters = filters;
  }

  FilterListings(listings: Listing[]) {
    var newlistings: any[] = [];
    listings.forEach(listing => {
      console.log(this.filters.brand + "vs" + listing.brand);
      if (
        this.filters.category &&
        listing.category.toLowerCase() !== this.filters.category.toLowerCase()
      ) return;

      if (
        this.filters.priceType.toLowerCase() === 'less' &&
        listing.price > this.filters.priceValue
      ) return;

      if (
        this.filters.priceType.toLowerCase() === 'more' &&
        listing.price < this.filters.priceValue
      ) return;

      if (
        this.filters.priceType.toLowerCase() === 'custom' &&
        (listing.price < this.filters.priceMin || listing.price > this.filters.priceMax)
      ) return;

      if (
        this.filters.condition &&
        listing.condition.toLowerCase().replaceAll(' ', '').trim() !==
        this.filters.condition.toLowerCase().replaceAll(' ', '').trim()
      ) return;

      if (this.filters.brand &&
        listing.brand.toLowerCase().replaceAll(' ', '').trim()
          .includes(this.filters.brand.toLowerCase().replaceAll(' ', '').trim()) == false
      )
        return;

      if (this.filters.model &&
        listing.model.toLowerCase().replaceAll(' ', '').trim()
          .includes(this.filters.model.toLowerCase().replaceAll(' ', '').trim()) == false
      )
        return;

      newlistings.push(listing);
      console.log(listing);
    });
    if (newlistings.length === 0) {
      return null;
    }
    return newlistings;
  }

  /*
      category: '',
    priceType: '',     // 'less', 'more', 'custom'
    priceValue: null,  // For less/more
    priceMin: null,    // Custom range min
    priceMax: null,    // Custom range max
    condition: '',
    brand: '',
    model: '',
    location: '',
    aiRating: '',
    dateType: '',      // 'before' or 'after'
    dateValue: ''  
  */
}

export interface Listing {
  id: number;
  user_id: number | null;
  title: string;
  price: number;
  description: string;
  seller: string;
  status: string;
  created_at: string;
  category: string;
  category_id: number;
  condition: string;
  brand: string;
  model: string;
  ai_rating: number;
  images: string[];
  videos: string[];
}