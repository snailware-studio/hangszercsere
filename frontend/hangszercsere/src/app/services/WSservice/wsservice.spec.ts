import { TestBed } from '@angular/core/testing';
import { TEST_IMPORTS } from '../../test-helper';
import { UserService } from '../user-service/user-service';
import { GlobalService } from '../GlobalService/global-service';
import { WSservice } from './wsservice';

describe('WSservice', () => {
  let service: WSservice;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockGlobalService: jasmine.SpyObj<GlobalService>;
  let mockWebSocket: any;

  beforeEach(() => {
    mockUserService = jasmine.createSpyObj('UserService', ['isLoggedIn', 'getUserId']);
    mockGlobalService = jasmine.createSpyObj('GlobalService', [], { dev: false });

    mockWebSocket = {
      send: jasmine.createSpy('send'),
      close: jasmine.createSpy('close'),
      readyState: WebSocket.OPEN,
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null
    };

    spyOn(window, 'WebSocket').and.returnValue(mockWebSocket);

    // Default: user is logged in
    mockUserService.isLoggedIn.and.returnValue(true);
    mockUserService.getUserId.and.returnValue(123);

    TestBed.configureTestingModule({
      providers: [
        WSservice,
        { provide: UserService, useValue: mockUserService },
        { provide: GlobalService, useValue: mockGlobalService }
      ]
    });

    service = TestBed.inject(WSservice);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should connect to production WebSocket when not in dev mode', () => {
    expect(window.WebSocket).toHaveBeenCalledWith('wss://hangszercsere.hu');
  });

  it('should register user when socket opens and user is logged in', () => {
    mockWebSocket.onopen();

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ action: 'register', userID: 123 })
    );
  });

  it('should send message when socket is open', () => {
    service.sendMessage(123, 456, 'Hello', 789);

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        action: 'message',
        userID: 123,
        toUserID: 456,
        message: 'Hello',
        listing: 789
      })
    );
  });

  it('should emit messages through observable', (done) => {
    const testMessage = { action: 'message', content: 'test' };

    service.message.subscribe(msg => {
      if (msg) {
        expect(JSON.parse(msg)).toEqual(testMessage);
        done();
      }
    });

    mockWebSocket.onmessage({ data: JSON.stringify(testMessage) });
  });
});