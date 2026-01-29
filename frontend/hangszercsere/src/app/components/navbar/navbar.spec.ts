import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';
import { UserService } from '../../services/user-service/user-service';
import { Router } from '@angular/router';
import { GlobalService } from '../../services/GlobalService/global-service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockGlobalService: any;

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', ['isLoggedIn', 'LogOut']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockGlobalService = { rootUrl: 'http://test.com' };

    await TestBed.configureTestingModule({
      declarations: [Navbar],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
        { provide: GlobalService, useValue: mockGlobalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set rootUrl from GlobalService', () => {
    expect(component.rootUrl).toBe('http://test.com');
  });

  describe('Navigation', () => {
    it('should navigate to profile with user id', () => {
      component.GotoProfile(123);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile', 123]);
    });
  });

  describe('Dropdown', () => {
    it('should toggle dropdown', () => {
      expect(component.dropdown).toBe(false);
      
      component.toggleDropdown();
      expect(component.dropdown).toBe(true);
      
      component.toggleDropdown();
      expect(component.dropdown).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should return true when user is logged in', () => {
      mockUserService.isLoggedIn.and.returnValue(true);
      
      expect(component.isLoggedIn()).toBe(true);
    });

    it('should return false when user is not logged in', () => {
      mockUserService.isLoggedIn.and.returnValue(false);
      
      expect(component.isLoggedIn()).toBe(false);
    });

    it('should call userService.LogOut when logging out', () => {
      component.LogOut();
      
      expect(mockUserService.LogOut).toHaveBeenCalled();
    });
  });

  describe('Menu', () => {
    it('should open login menu', () => {
      component.openMenu('login');
      
      expect(component.menu).toBe('login');
    });

    it('should open register menu', () => {
      component.openMenu('register');
      
      expect(component.menu).toBe('register');
    });

    it('should close menu', () => {
      component.menu = 'login';
      
      component.closeMenu();
      
      expect(component.menu).toBe('none');
    });
  });
});