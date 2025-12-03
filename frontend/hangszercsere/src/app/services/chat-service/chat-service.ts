import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Listing } from '../listing-service/listing-service';
import { GlobalService } from '../GlobalService/global-service';
import { WSservice } from '../WSservice/wsservice';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  
current_listing: Listing = null;

apiurl: string = "https://hangszercsere.hu/api/messages";

constructor(private http: HttpClient,
  private global: GlobalService,
  private ws: WSservice
) {
  this.apiurl = this.global.apiUrl+'messages';
}

GetAllMessages(userId: number): Observable<any> {
  return this.http.get(`${this.apiurl}/${userId}`);
}

GetMessages(listingId: number, userId: number): Observable<any> {
  return this.http.get(`${this.apiurl}/${listingId}/${userId}`);
}

SendMessage(sent_from: number, sent_to: number, content: string, listing_id: number) {
  this.ws.sendMessage(sent_from, sent_to, content, listing_id);
}

}

export interface message
{
  sent_from: number;
  sent_to: number;
  content: string;
  created_at: string;
}