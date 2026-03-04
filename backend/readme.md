# Hangszercsere.hu backend

## SQLite adatbázis
A `database.db` fileban tárol és olvas, ha nincsen akkor első futtatáskor készít egyet.

## Multer file tárolás
A `multer` npm csomag segítségével tárol fájlokat.

## Portok használata
A `3000` portot használja.

## Futtatás
```
npm install
npm start
```

### .env Fájl beállítása
```
#email creds
EMAIL_USER=email@example.com
EMAIL_PASS=password

#frontend port vagy ip
ORIGIN=http://localhost:4200

#backend port vagy ip
BACKEND=http://localhost:3000

#api key AI-hoz
API_KEY=apikey
```