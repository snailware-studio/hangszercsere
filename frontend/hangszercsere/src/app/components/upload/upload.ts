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
  }

  title: string = '';
  price: number | null = null;
  description: string = '';
  seller: string = '';
  status: string = 'active';
  category_id: number = null;
  condition: string = '';
  brand: string = '';
  model: string = '';

  imagePath: string[] = [];

  selectedImages: File[] | null = [];
  selectedVideos: File[] | null = []; 
  PreviewImages: string[] = [];
  PreviewVideos: string[] = [];

  uploadProgress: number = 0;

  onSelectImages(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    const newFiles = Array.from(files);

    if (!this.selectedImages) {
      this.selectedImages = newFiles;
    } else {
      this.selectedImages.push(...newFiles);
    }

    this.PreviewImages = this.selectedImages.map(f => URL.createObjectURL(f));
    (event.target as HTMLInputElement).value = '';
  }

  onSelectVideos(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    const newFiles = Array.from(files);
    this.selectedVideos.push(...newFiles);

    console.log('Selected videos:', this.selectedVideos);

    this.PreviewVideos = this.selectedVideos.map(f => URL.createObjectURL(f));

    console.log('Preview videos:', this.PreviewVideos);
    (event.target as HTMLInputElement).value = '';
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
        this.NotifService.show('success',"Upload successful 🎉");
        this.router.navigate(['/listing', listingId]);
      }
    },
    error: (err) => {
      console.error('Media upload failed', err);
      this.NotifService.show('error','Upload failed: ' + (err.error?.error || 'Unknown error'));

    }
  });
}

  UploadListing(): void {
  if (!this.userService.isLoggedIn())  {
    alert("You must be logged in!");
    this.router.navigate(['/login']);
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
