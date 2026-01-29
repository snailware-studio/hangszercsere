import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Timestamp, of, tap } from 'rxjs';
import { Filters } from '../../components/filter/filter';
import { GlobalService } from '../GlobalService/global-service';
import { HttpParams } from '@angular/common/http';

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

  MyListings(): Observable<any> {
    return this.http.get(`${this.global.rootUrl}/api/mylistings`, {
      withCredentials: true
    });
  }

GetListings(): Observable<any> {
  let params = new HttpParams();

  Object.entries(this.global.filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, value.toString());
    }
  });

  return this.http.get(this.apiUrl, {
    params,           
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

  GetCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl.substring(0,this.apiUrl.length-12)}/categories`);
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