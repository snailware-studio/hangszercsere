
# Hangszercsere.hu backend

## SQLite adatbázis
A `database.db` fileban tárol és olvas, ha nincsen, akkor első futtatáskor készít egyet.

## Multer file tárolás
A `multer` npm csomag segítségével tárol fájlokat.

## Portok használata
Csak a  `3000` portot használja.

## Futtatás

ℹ️ NodeJS verzió: >25
ℹ️ NPM verzió: >11

```
npm install
npm run listen
```

### Környezeti változó fájl beállítása
```
#email adatok
EMAIL_USER=példa@email.cím
EMAIL_PASS=példajelszó123

# ha port nélkül van (pl domain) akkor ORIGIN és BACKEND megegyezik!
#frontend ip
ORIGIN=http://localhost:4200

#backend ip
BACKEND=http://localhost:3000

#api kulcs AI-hoz
API_KEY=ide az api kulcs (https://pollinations.ai/)
```
