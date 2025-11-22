import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Upload } from './components/upload/upload';
import { HomePage } from './components/home-page/home-page';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { ListingPage } from './components/listing-page/listing-page';
import { Register } from './components/register/register';
import { Login } from './components/login/login';
import { Cart } from './components/cart/cart';
import { AdminPanel } from './components/admin-panel/admin-panel';
import { ChatComponent } from './components/chat-component/chat-component';
import { Lightbox } from './components/lightbox/lightbox';
import { ProfilePage } from './components/profile-page/profile-page';
import { EditProfilePage } from './components/edit-profile-page/edit-profile-page';
import { EditListingPage } from './components/edit-listing-page/edit-listing-page';
import { Filter } from './components/filter/filter';
import { TimeAgoPipe } from './pipes/timeAgo/time-ago-pipe';
import { NotifComponent } from './components/notif-component/notif-component';

@NgModule({
  declarations: [
    App,
    Upload,
    HomePage,
    Navbar,
    Footer,
    ListingPage,
    Register,
    Login,
    Cart,
    AdminPanel,
    ChatComponent,
    Lightbox,
    ProfilePage,
    EditProfilePage,
    EditListingPage,    
    Filter,
    TimeAgoPipe,
    NotifComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [
  ],
  bootstrap: [App]
})
export class AppModule { }
