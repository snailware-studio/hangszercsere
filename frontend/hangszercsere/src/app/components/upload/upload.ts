import { Component,OnInit } from '@angular/core';
import { ListingService } from '../../services/listing-service/listing-service';
import { UserService } from '../../services/user-service/user-service';
import { Router} from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { NotifService } from '../../services/notif-service/notif-service';

@Component({
  selector: 'app-upload',
  standalone: false,
  templateUrl: './upload.html',
  styleUrl: './upload.css'
})
export class Upload {
  constructor(
    private ListingService: ListingService,
    private userService: UserService,
    private router: Router,
    private NotifService: NotifService
  ) {}

  ngOnInit(): void
  { 
    if (!this.userService.isLoggedIn()) {
      this.NotifService.show('error',"You must be logged in!");
      this.router.navigate(['/login']);
    }

    this.GetCategories();
  }

  title: string = '';
  price: number | null = null;
  description: string = '';
  seller: string = '';
  status: string = 'inactive';
  category_id: number = null;
  condition: string = '';
  brand: string = '';
  model: string = '';

  imagePath: string[] = [];

  selectedImages: File[] | null = [];
  selectedVideos: File[] | null = []; 
  PreviewImages: string[] = [];
  PreviewVideos: string[] = [];

  categories: string[] = [];

  uploadProgress: number = 0;

  GetCategories(): void {
    this.ListingService.GetCategories().subscribe({
      next: (res) => {
        this.categories = res;
      },
      error: (err) => {
        console.error('Failed to get categories', err);
        this.NotifService.show('error','Failed to get categories: ' + (err.error?.error || 'Unknown error'));
      }
    });
  }

onSelectMedia(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;

  const files = Array.from(input.files);

  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      this.selectedImages.push(file);
      this.PreviewImages.push(URL.createObjectURL(file));
    } 
    else if (file.type.startsWith('video/')) {
      this.selectedVideos.push(file);
      this.PreviewVideos.push(URL.createObjectURL(file));
    }
  });

  input.value = '';
}


  
AddMedia(listingId: number): void {
  const images = this.selectedImages;
  const videos = this.selectedVideos;

  this.ListingService.AddMedia(images, videos, listingId).subscribe({
    next: (event) => {
      // track %
      if (event.type === HttpEventType.UploadProgress && event.total) {
        this.uploadProgress = Math.round(100 * event.loaded / event.total);
        //console.log('Upload progress:', this.uploadProgress + '%');
      }

      if (event.type === HttpEventType.Response) {
        console.log('Media upload successful', event.body);
        this.NotifService.show('success',"Sikeresen feltöltve!! 🎉");
        this.router.navigate(['/my-listings']);
      }
    },
    error: (err) => {
      console.error('Media upload failed', err);
      this.NotifService.show('error','Hiba: ' + (err.error?.error || 'Unknown error'));

    }
  });
}

  UploadListing(): void {
  if (!this.userService.isLoggedIn())  {
    this.NotifService.show("warning","Be kell jelentkezned!");
    this.router.navigate(['/login']);
    return;
  }

  if(this.selectedImages.length == 0 && this.selectedVideos.length == 0)
  {
    this.NotifService.show('warning','Nincs kép vagy videó feltöltve!');
    return;
  }

  const newListing: any = {
    user_id: this.userService.getUserId(),
    title: this.title,
    price: this.price,
    description: this.description,
    status: this.status,
    category_id: this.category_id,
    condition: this.condition,
    brand: this.brand,
    model: this.model,
  };

  console.log(newListing);
  
  this.ListingService.AddListing(newListing).subscribe({
    next: (res) => {
      console.log('Listing upload successful', res);
      this.AddMedia(res.id);
    },
    error: (err) => {
      console.error('Listing upload failed', err);
      this.NotifService.show('error',"Upload failed: " + (err.error?.error || 'Unknown error'));
    }
  });
}
}
