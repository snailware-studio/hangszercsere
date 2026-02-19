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
import { ConfirmComponent } from './components/confirm-component/confirm-component';
import { CookieBanner } from './components/cookie-banner/cookie-banner';
import { PopupComponent } from './components/popup-component/popup-component';
import { AdatvedelemComponent } from './components/adatvedelem-component/adatvedelem-component';
import { AszfComponent } from './components/aszf-component/aszf-component';
import { ImpresszumComponent } from './components/impresszum-component/impresszum-component';
import { MarkdownModule } from 'ngx-markdown';
import { MylistingsComponent } from './components/mylistings-component/mylistings-component';
import { HistoryComponent } from './components/history-component/history-component';
import { MobileAppView } from './components/mobile-app-view/mobile-app-view';

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
    ConfirmComponent,
    CookieBanner,
    PopupComponent,
    AdatvedelemComponent,
    AszfComponent,
    ImpresszumComponent,
    MylistingsComponent,
    HistoryComponent,
    MobileAppView,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    MarkdownModule.forRoot()
  ],
  providers: [
  ],
  bootstrap: [App]
})
export class AppModule { }
