import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Upload } from './upload';
import { TEST_IMPORTS } from '../../test-helper';
import { ListingService } from '../../services/listing-service/listing-service';
import { UserService } from '../../services/user-service/user-service';
import { NotifService } from '../../services/notif-service/notif-service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpEventType } from '@angular/common/http';

describe('Upload', () => {
  let component: Upload;
  let fixture: ComponentFixture<Upload>;
  let mockListingService: jasmine.SpyObj<ListingService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockNotifService: jasmine.SpyObj<NotifService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {

    mockListingService = jasmine.createSpyObj('ListingService', ['GetCategories', 'AddListing', 'AddMedia']);
    mockUserService = jasmine.createSpyObj('UserService', ['isLoggedIn', 'getUserId']);
    mockNotifService = jasmine.createSpyObj('NotifService', ['show']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockUserService.isLoggedIn.and.returnValue(true);
    mockListingService.GetCategories.and.returnValue(of(['Gitár', 'Billentyűs']));

    await TestBed.configureTestingModule({
      declarations: [Upload],
      imports: [...TEST_IMPORTS],
      providers: [
        { provide: ListingService, useValue: mockListingService },
        { provide: UserService, useValue: mockUserService },
        { provide: NotifService, useValue: mockNotifService },
        { provide: Router, useValue: mockRouter }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Upload);
    component = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should redirect to login if user is not logged in', () => {
      mockUserService.isLoggedIn.and.returnValue(false);

      fixture.detectChanges();

      expect(mockNotifService.show).toHaveBeenCalledWith('error', 'You must be logged in!');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should load categories if user is logged in', () => {
      mockUserService.isLoggedIn.and.returnValue(true);
      mockListingService.GetCategories.and.returnValue(of(['Electronics', 'Clothing']));

      fixture.detectChanges();

      expect(mockListingService.GetCategories).toHaveBeenCalled();
      expect(component.categories).toEqual(['Electronics', 'Clothing']);
    });

    it('should show error if categories fail to load', () => {
      mockUserService.isLoggedIn.and.returnValue(true);
      const error = { error: { error: 'Network error' } };
      mockListingService.GetCategories.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(mockNotifService.show).toHaveBeenCalledWith('error', 'Failed to get categories: Network error');
    });
  });

  describe('UploadListing', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should redirect to login if user is not logged in', () => {
      mockUserService.isLoggedIn.and.returnValue(false);

      component.UploadListing();

      expect(mockNotifService.show).toHaveBeenCalledWith('warning', 'Be kell jelentkezned!');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should show warning if no images or videos selected', () => {
      mockUserService.isLoggedIn.and.returnValue(true);
      component.selectedImages = [];
      component.selectedVideos = [];

      component.UploadListing();

      expect(mockNotifService.show).toHaveBeenCalledWith('warning', 'Nincs kép vagy videó feltöltve!');
      expect(mockListingService.AddListing).not.toHaveBeenCalled();
    });

    it('should successfully upload listing with valid data', () => {
      mockUserService.isLoggedIn.and.returnValue(true);
      mockUserService.getUserId.and.returnValue(123);
      mockListingService.AddListing.and.returnValue(of({ id: 456 }));
      mockListingService.AddMedia.and.returnValue(of({
        type: HttpEventType.Response,
        body: { success: true }
      } as any));

      component.selectedImages = [new File([''], 'test.jpg')];
      component.title = 'Test Listing';
      component.price = 100;
      component.description = 'Test Description';
      component.category_id = 1;

      component.UploadListing();

      expect(mockListingService.AddListing).toHaveBeenCalledWith(
        jasmine.objectContaining({
          user_id: 123,
          title: 'Test Listing',
          price: 100,
          description: 'Test Description'
        })
      );
    });

    it('should show error message if listing upload fails', () => {
      mockUserService.isLoggedIn.and.returnValue(true);
      mockUserService.getUserId.and.returnValue(123);
      const error = { error: { error: 'Server error' } };
      mockListingService.AddListing.and.returnValue(throwError(() => error));

      component.selectedImages = [new File([''], 'test.jpg')];

      component.UploadListing();

      expect(mockNotifService.show).toHaveBeenCalledWith('error', 'Upload failed: Server error');
    });
  });

  describe('AddMedia', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should track upload progress', () => {
      const progressEvent = {
        type: HttpEventType.UploadProgress,
        loaded: 50,
        total: 100
      };

      mockListingService.AddMedia.and.returnValue(of(progressEvent as any));

      component.AddMedia(123);

      expect(component.uploadProgress).toBe(50);
    });

    it('should navigate to my-listings on success', () => {
      const responseEvent = {
        type: HttpEventType.Response,
        body: { success: true }
      };

      mockListingService.AddMedia.and.returnValue(of(responseEvent as any));

      component.AddMedia(123);

      expect(mockNotifService.show).toHaveBeenCalledWith('success', 'Sikeresen feltöltve!! 🎉');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my-listings']);
    });

    it('should show error message on media upload failure', () => {
      const error = { error: { error: 'Upload failed' } };
      mockListingService.AddMedia.and.returnValue(throwError(() => error));

      component.AddMedia(123);

      expect(mockNotifService.show).toHaveBeenCalledWith('error', 'Hiba: Upload failed');
    });
  });

  describe('Form validáció', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should start with empty values', () => {
      expect(component.title).toBe('');
      expect(component.price).toBeNull();
      expect(component.description).toBe('');
      expect(component.status).toBe('inactive');
    });

    it('should allow setting form values', () => {
      component.title = 'guitar';
      component.price = 250000;
      component.description = 'Great product';
      component.condition = 'Új';
      component.brand = 'Gibson';
      component.model = 'SG';

      expect(component.title).toBe('guitar');
      expect(component.price).toBe(250000);
      expect(component.condition).toBe('Új');
    });
  });
});