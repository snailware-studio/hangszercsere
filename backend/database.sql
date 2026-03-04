BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "ai_queue" (
	"id"	INTEGER,
	"listing_id"	INTEGER NOT NULL UNIQUE,
	"eligible_at"	DATETIME NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "cart_items" (
	"id"	INTEGER,
	"cart_id"	INTEGER NOT NULL,
	"listing_id"	INTEGER NOT NULL,
	"added_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	UNIQUE("cart_id","listing_id"),
	PRIMARY KEY("id"),
	FOREIGN KEY("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE,
	FOREIGN KEY("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "carts" (
	"id"	INTEGER,
	"user_id"	INTEGER NOT NULL UNIQUE,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "categories" (
	"id"	INTEGER,
	"name"	TEXT NOT NULL UNIQUE,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "listings" (
	"id"	INTEGER,
	"user_id"	INTEGER,
	"title"	TEXT NOT NULL,
	"description"	TEXT,
	"price"	REAL NOT NULL,
	"status"	TEXT DEFAULT 'inactive' CHECK("status" IN ('inactive', 'active', 'sold')),
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"category_id"	INTEGER,
	"condition"	TEXT CHECK("condition" IN ('Új', 'Nagyon jó', 'Jó', 'Elfogadható')),
	"brand"	TEXT,
	"model"	TEXT,
	"ai_rating"	REAL CHECK("ai_rating" >= 0 AND "ai_rating" <= 5),
	"ai_reviewed"	BOOLEAN DEFAULT 0,
	"ai_feedback"	TEXT,
	PRIMARY KEY("id"),
	FOREIGN KEY("category_id") REFERENCES "categories"("id") ON DELETE SET NULL,
	FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "media" (
	"id"	INTEGER,
	"listing_id"	INTEGER NOT NULL,
	"url"	TEXT NOT NULL,
	"type"	TEXT NOT NULL CHECK("type" IN ('image', 'video')),
	PRIMARY KEY("id"),
	FOREIGN KEY("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "messages" (
	"id"	INTEGER,
	"sent_from"	INTEGER,
	"sent_to"	INTEGER,
	"listing_id"	INTEGER,
	"content"	TEXT NOT NULL,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"reply_to"	INTEGER DEFAULT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL,
	FOREIGN KEY("reply_to") REFERENCES "messages"("id") ON DELETE SET NULL,
	FOREIGN KEY("sent_from") REFERENCES "users"("id") ON DELETE SET NULL,
	FOREIGN KEY("sent_to") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "reviews" (
	"id"	INTEGER,
	"listing_id"	INTEGER,
	"transaction_id"	INTEGER,
	"sent_from"	INTEGER,
	"sent_to"	INTEGER,
	"rating"	REAL CHECK("rating" >= 0 AND "rating" <= 5),
	"comment"	TEXT,
	"timestamp"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"anonymous"	BOOLEAN DEFAULT 0,
	PRIMARY KEY("id"),
	FOREIGN KEY("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL,
	FOREIGN KEY("sent_from") REFERENCES "users"("id") ON DELETE SET NULL,
	FOREIGN KEY("sent_to") REFERENCES "users"("id") ON DELETE SET NULL,
	FOREIGN KEY("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "sessions" (
	"session_id"	TEXT,
	"user_id"	INTEGER NOT NULL,
	"expires"	DATETIME NOT NULL,
	PRIMARY KEY("session_id")
);
CREATE TABLE IF NOT EXISTS "transactions" (
	"id"	INTEGER,
	"sent_from"	INTEGER,
	"sent_to"	INTEGER,
	"price"	REAL NOT NULL,
	"status"	TEXT DEFAULT 'pending' CHECK("status" IN ('pending', 'completed', 'cancelled')),
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"completed_at"	DATETIME,
	"listing_id"	INTEGER NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("sent_from") REFERENCES "users"("id") ON DELETE SET NULL,
	FOREIGN KEY("sent_to") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "user_stats" (
	"user_id"	INTEGER,
	"total_listings"	INTEGER DEFAULT 0,
	"total_sold"	INTEGER DEFAULT 0,
	"total_spent"	REAL DEFAULT 0,
	"total_earned"	REAL DEFAULT 0,
	"last_login"	DATETIME,
	"active_listings"	INTEGER DEFAULT 0,
	"rating_count"	INTEGER DEFAULT 0,
	"total_reviews"	INTEGER DEFAULT 0,
	PRIMARY KEY("user_id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER,
	"name"	TEXT NOT NULL UNIQUE,
	"pass_hash"	TEXT NOT NULL,
	"location"	TEXT,
	"rating"	REAL CHECK("rating" >= 0 AND "rating" <= 5),
	"join_date"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"email"	TEXT,
	"email_verified"	BOOLEAN DEFAULT 0,
	"profile_url"	TEXT DEFAULT 'default_avatar.png',
	"bio"	TEXT,
	"role"	TEXT DEFAULT 'user',
	"status"	TEXT DEFAULT 'active',
	"phone"	TEXT,
	PRIMARY KEY("id")
);
INSERT INTO "carts" ("id","user_id","created_at") VALUES (1,1,'2026-01-21'),
 (2,2,'2026-01-21'),
 (3,3,'2026-01-21');
INSERT INTO "categories" ("id","name") VALUES (0,'Egyéb'),
 (1,'Gitár'),
 (2,'Dob'),
 (3,'Billentyűs'),
 (4,'Basszusgitár'),
 (5,'Erősítő'),
 (6,'Pedál'),
 (7,'Stúdió');
INSERT INTO "listings" ("id","user_id","title","description","price","status","created_at","category_id","condition","brand","model","ai_rating","ai_reviewed","ai_feedback") VALUES (1,1,'Stratocaster','black ssh strat.',35000.0,'active','2025-11-02 15:52:52',1,'Nagyon jó','Harley Benton','ST-20HSS',3.3,1,'Az alapok megvannak (márka, modell, állapot és 3 kép), ezért jobb az előző 2.6‑nál, de a leírás túl szűkszavú. Hiányoznak kulcsfontosságú adatok: részletes állapotleírás (húrok, bundok/fogólap kopása, elektronikák), szériaszám/gyártási ország, tartozékok és szerviz/állítási információk; nincs hangminta vagy videó, és a pénznem/megjegyzés az árhoz nincs feltüntetve. Javítási javaslatok: bővítsd a címet (pl. Harley Benton ST‑20HSS black), írd le pontosan a műszaki és kozmetikai állapotot, tölts fel közeli képeket a fejrészről, szériaszámról, fogólapról és esetleges sérülésekről, adj meg tartozékokat, szállítást/fizetést/alku feltételeit, és csatolj rövid videót hangmintával — ez sokat növeli a bizalmat és a megvásárlás esélyét.'),
 (2,1,'Yamaha Keyboard','yamaha NP-35 színpadi zongora.
76 billentyűs (touch responsive)
15 preset hangszín (zongora, elektronikus zongora, 
orgona, vonósok stb.)
64 hangú polifónia
Beépített 6 W × 2 hangszóró
USB to Host MIDI/AUDIO csatlakozás – számítógéphez/tablethez való kapcsolódásra.
kimenet fejhallgatóhoz
Sustain/lábpedál bemenet
Tápegység vagy 6×AA elem
(kb. 126 cm × 26 cm × 10 cm, 6 kg)
kopások/hibák/tartozékok nélkül
helyben átvehető vagy tudom postázni.',60000.0,'active','2025-11-02 15:54:00',3,'Nagyon jó','Yamaha','NP-35',4.2,1,'Pozitívumok

- Jó alap: részletes műszaki adatok (billentyűszám, polifónia, hangszórók, csatlakozók), méret/súly és 3 kép szerepelnek. Az állapotként megadott „Nagyon jó” és az ár (60 000 Ft) összhangban vannak.

Javító javaslatok (konkrét, gyorsan megvalósítható)

- Tisztázd a tartozékokat: a szövegben szereplő „tápegység vagy 6×AA elem” és a „tartozékok nélkül” kifejezés ellentmondásos — írd egyértelműen, jár‑e a tápegység és a sustain pedál.
- Rövid működési állapot: jelezd, hogy minden billentyű, gomb és a sustain bemenet teljesen működik‑e, van‑e zaj vagy hibajelenség.
- Fotók kiegészítése: közeli képek a billentyűkről, csatlakozókról, hátlapról/sorozatszámról, valamint a tápegység/pedál fotója; ha lehet, rövid működést bemutató videó vagy hangminta.
- Szállítás és fizetés: add meg postaköltséget/átvételi helyet (város/irányítószám), elfogadott fizetési módokat és hogy alkudható‑e az ár.

Összegzés

Jó, informatív hirdetés, néhány világosítás (tartozékok, sorozatszám, működés) és kiegészítő fotó sok kérdéstől megszabadít és növeli az eladási esélyt.'),
 (3,1,'Fender Guitar','acoustic guitar',40000.0,'active','2025-11-02 15:54:25',1,'Nagyon jó','Fender','',2.2,1,'Túl szűkszavú és hiányos: csak „Fender” és „acoustic guitar” szerepel, nincs modell, évjárat/ser. szám, faanyag, méret, részletes állapotleírás vagy képek megadva (a bemenetben képlista nincs). Az ár (40000) valuta és összehasonlítás nélkül nem értelmezhető. Javaslat: add meg pontos modellt és sorozatszámot, korát, test/nyak anyagát, testtípust (dreadnought, 000 stb.), részletezd az állapotot (kopás, fogólap, bundok, hangolók), tüntesd fel tartozékokat és szállítási/pickup feltételeket, tölts fel több fotót (fej, matricalap/ser. szám, teljes test, fogólap, híd, esetleges hibák), és aktív státuszban tedd közzé. Az ár megindoklása vagy összehasonlító hirdetések növelik a bizalmat.'),
 (5,1,'HB-20R Amplifier','Elektromos gitár erősítő',40000.0,'active','2025-11-04 15:23:22',5,'Nagyon jó','Harley Benton','HB-20R',2.4,1,'Nagyon tömör a hirdetés: csak cím és egy sor leírás, valamint az állapotmegjelölés szerepel, de nincsenek képek, részletes műszaki adatok vagy elérhetőségi/információk az ár mögött. Javaslat: tüntesd fel a pénznemet és, hogy alkuképes-e az ár, add meg a watt-számot, bemenet/kimenet típusokat, méreteket/súlyt, sorozatszámot és esetleges hibákat, írj néhány mondatot az állapot pontos részleteiről, csatolj több jó minőségű fotót (vagy rövid videót) működés közben, valamint írd meg a helyszínt, átadás/garancia feltételeit — ezek növelik a bizalmat és az eladhatóságot.'),
 (6,1,'Ernie Ball Super Slinky 2223','Ernie Ball Super Slinky 2223 gitár húrok',4000.0,'active','2025-11-04 15:24:48',0,'Új','Ernie Ball','Super Slinky 2223',3.2,1,'Rövid összegzés: jó, hogy szerepel márka, modell, állapot és 3 fotó, de a leírás túl rövid és a hirdetés inaktív — több konkrét adat növelné az érdeklődést.

Javasolt javítások:

- Add meg a húrok pontos vastagságát/gauge-ét (például 10-46 vagy 9-42) és hogy elektromos gitárhoz valók-e.
- Írd le, hány szett van (1 db vagy több), eredeti, lezárt csomagban vannak-e, és van-e nyugta/garancia vagy eredetiség igazolás.
- Tisztázd a szállítási és fizetési feltételeket (posta díja, személyes átvétel helye, utánvétel/előre utalás).
- Aktiváld a hirdetést és helyezd át releváns kategóriába (pl. Gitár / Húrok), így többen látják.
- Tölts fel további fotókat: csomagolás elöl-hátul, címkék/kódok közelről, esetleges sérülések részletei.
- Ár: 4 000 Ft reálisnak tűnik új single szettre, de a pontos gauge és darabszám megadása segít a véglegesítében.

Ezekkel átláthatóbb lesz az ajánlat és gyorsabban jelentkeznek a vevők.'),
 (7,1,'Behringer Mixer','Behringer keverőpult, stúdió minőség, 12 csatornás, nagyon jó állapotban.',55000.0,'active','2025-11-21 12:00:00',5,'Nagyon jó','Behringer','Xenyx 1202FX',3.0,1,'Jó, hogy szerepel a márka és pontos modell, de a hirdetés túl rövid. Hiányoznak fotók, részletes specifikációk (milyen bemenetek, phantom, effekt, csatlakozók), a működés/teszt állapota, esetleges hibák/karcok, tartozékok és szállítási/fizetési információ. A 55 000-es ár a megadott adatok alapján nem igazolt — add meg a valutát, tegyél fel több, részletes fotót és egy rövid videót/tesztet, írd le az alkukészséget és minden hiányzó műszaki adatot.'),
 (8,1,'Boss Pedal','Boss gitár pedál, jól működik, gyári állapot.',25000.0,'active','2025-11-21 12:10:00',6,'Nagyon jó','Boss','Unknown',2.4,1,'Túl kevés információ. Hiányzik a pontos modell/típus (Melyik Boss pedál?), részletes állapotleírás (kopás, hibák, sorozatszám, eredeti doboz/tartozékok) és fotók/videó. Javítsd a hirdetést: add meg a modellnevet, készíts több jó minőségű képet külön szögekből, írj részletesen a működésről és esetleges hibákról, adj hangmintát vagy rövid videót, és indokold az árat vagy jelezd az alkukészséget.'),
 (9,1,'Capo','Gitár capo, állítható, karcmentes.',2500.0,'active','2025-11-21 12:15:00',1,'Nagyon jó','','',3.0,1,'Rövid és tömör a leírás, pozitív, hogy megadtad az állapotot (karcmentes, Very Good), de sok fontos rész hiányzik. Javasolt javítások: írd meg a márkát és modellt (ha nincs, jelezd), a típusát (rugós/csavaros/állítható pontos mechanika), milyen gitárhoz való (acoustic/electric/classical), anyag/méret, működési állapot részletei, tartozékok és átadás/szállítás feltételei. Tegyél fel több fényképet több szögből és közeli képet a rögzítőről, illetve állítsd aktívra a hirdetést. A cím is lehetne informatívabb: pl. „Állítható capo – [márka/modell], karcmentes”.'),
 (10,1,'Casio Sustain Pedal','Casio sustain pedál, digitális zongorához.',4000.0,'active','2025-11-21 12:20:00',3,'Nagyon jó','Casio','SP-20',3.0,1,'Alapadatok megvannak (márka, modell, állapot, ár), de a leírás túl rövid és hiányoznak kulcsinformációk: nincs megadva a pénznem, nincsenek fotók, nincs részletes állapot- és működésleírás, valamint szállítás/átvétel információ. Javaslat: aktiváld újra a hirdetést, tölts fel több képet (pedál, csatlakozó, esetleges sérülések), írd le hogy működik-e, van-e kapcsoló/polaritás, mely digitális zongorákkal kompatibilis, add meg a pénznemet és átadási/szállítási feltételeket, illetve jelezd, ha az ár alkuképes.'),
 (11,1,'Drum Throne','Dobos ülőke, állítható magasság, stabil.',12000.0,'active','2025-11-21 12:25:00',2,'Nagyon jó','Yamaha','',2.8,1,'## Rövid értékelés
A hirdetés túl tömör: van márkajelzés és egy kép, de hiányoznak a kulcsinfók és a hirdetés inaktív, ezért nehéz megbízni benne. Az ár önmagában nem feltűnően irreális, de a részletek hiánya csökkenti az érdeklődést.

## Mit javíts fel gyorsan
- Írd be a modellnevét vagy pontos típusát (ha ismeretlen, írd le a matricákat/jeleket).  
- Add meg a műszaki adatokat: ülésátmérő, ülés anyaga, minimális/maximális magasság, állítás típusa (csavar, gyorskioldó stb.), teherbírás.  
- Részletezd az állapotot: milyen kopások, foltok vagy laesések vannak-e; ha nincs, írd, hogy hibátlan.  
- Tölts fel több képet: felülről, oldalról, alsó részről és közelről a beállító mechanikáról; ha lehet, egy rövid videó a magasságállításról.  
- Aktiváld a hirdetést, és írj szállítás/átvétel feltételeket, valamint hogy alkuképes-e az ár.

Ezek a változtatások növelik a bizalmat és az eladási esélyt.'),
 (12,1,'Audio Interface','USB audio interface, 2 input/2 output, stúdió minőség.',35000.0,'active','2025-11-21 12:30:00',5,'Nagyon jó','Focusrite','Scarlett 2i2',3.1,1,'Van márka, modell, állapot és ár megadva, ez jó kiindulópont, de a leírás túl rövid. Hiányoznak részletek (melyik generáció/év, tartozékok/ kábel/eredeti doboz, garancia/serial, kompatibilitás, működési állapot) és nincs említés fotókról — ezek nélkül nehéz dönteni. Javítás: pontosítsd a címet (pl. „Focusrite Scarlett 2i2 3rd gen”), adj több jó fotót a csatlakozókról és az előlap/hátlap sérüléseiről, írd le hogy minden bemenet/kimenet működik-e, mit tartalmaz az ár, valamint adj átadási/posta információt és a használt valuta megjelölését.'),
 (13,1,'Jazz Bass','Jazz Bass, nagyon szép hang, minimális karc.',65000.0,'active','2025-11-21 12:35:00',4,'Nagyon jó','Fender','Jazz Bass',2.1,1,'Túl szűkszavú, nehezen értékelhető hirdetés. Az ár (65 000) nagyon alacsonynak tűnik egy Fender Jazz Bass esetében és nincs megadva valuta; a státusz inaktív, és nincsenek fotók vagy részletes műszaki adatok. Javaslat: add meg pontos évjáratot/modellszámot/serialt, részletezd a kopásokat (fret wear, elektronikák, nyak állapota), tüntesd fel jár-e tok vagy számla, és tölts fel több jó minőségű képet (előlap, hátlap, fej, fogólap, híd, serial close-up). Aktiváld a hirdetést, írd le átadás/szállítás feltételeit, illetve indokold vagy igazítsd az árat — ezek jelentősen növelik a bizalmat és az eladási esélyt.'),
 (14,1,'MG10G Amplifier','Marshall MG10G gitárerősítő, 10W, kompakt.',22000.0,'active','2025-11-21 12:40:00',5,'Nagyon jó','Marshall','MG10G',3.2,1,'Ár: 22 000 reálisnak tűnik egy használt Marshall MG10G (10W) esetén. A hirdetés viszont túl rövid és hiányos: tegyél fel több fotót a készülékről, írj részletes állapotleírást (működés, kopások/hibák), sorozatszámot és tartozékokat, valamint add meg átvétel/szállítás és fizetési feltételeket. Aktiváld a hirdetést és egészítsd ki műszaki adatokkal (bem./kimenetek, méretek/súly) és kapcsolattal — ezek növelik a vásárlói bizalmat és esélyét az eladásnak.'),
 (15,1,'Paiste Cymbals','Paiste cintányérok, kiváló állapot, stúdió minőség.',45000.0,'active','2025-11-21 12:45:00',2,'Nagyon jó','Paiste','',2.3,1,'A hirdetés túl rövid: megvan a márka, állapot és ár, de hiányoznak alapvető részletek. Add meg, hány darab és milyen típusú cintányérok (ride/crash/hihat), átmérők, modellek/termékkódok, készlet vagy darabár, esetleges hibák/elemi kopások, tartozékok (tok, állvány), valamint szállítás/pickup és fizetési feltételek. Tölts fel több közeli fotót és videót, pontosítsd a pénznemet, és aktiváld a hirdetést — ezek növelik a vevői bizalmat és az eladási esélyt.'),
 (16,1,'Shure Microphone','Shure SM58 mikrofon, élő fellépéshez és stúdióhoz.',30000.0,'active','2025-11-21 12:50:00',5,'Nagyon jó','Shure','SM58',3.0,1,'Alapinformációk megvannak (márka, modell, állapot, ár), az ár (30 000) reálisnak tűnik használt SM58 esetén, de a valuta nincs megadva. Hiányoznak a képek és részletes állapotleírás (használati nyomok, széria/szám, javítások, tartozékok, doboz, garancia), illetve nincs megadva szállítás/átvétel és alku lehetősége. Javasolt: aktiváld a hirdetést, tölts fel több közeli fotót (rács, XLR-csatlakozó, teljes mikrofon), írj rövid tesztleírást vagy hang/videó mintát, és pontosítsd a valutát/kapcsolattartási feltételeket.'),
 (19,5,'Test','Ez egy teszt leírás.',20000.0,'active','2026-01-30 11:48:51',0,'Új','-','teszter',1.8,1,'### Rövid értékelés
A hirdetés nagyon szűkszavú: a cím és leírás nem azonosítja a hangszer típusát és hiányoznak a fontos műszaki adatok, így a vevő számára nehéz eldönteni, hogy mit kínálsz.

### Konkrét javítási javaslatok
- Cím: pontosítsd a hangszer típusát és márkát (pl. „Elektrikus gitár — Fender Stratocaster” vagy „Szintetizátor — KORG [modell]”).
- Márka/modell: ne hagyd „-” értéken a márkát; add meg a gyártót és a pontos modellt.
- Állapot részletezése: mit jelent az „Új”? bontatlan doboz, bemutató darab, garancia van-e?
- Műszaki adatok: sorozatszám, gyártási év, méretek/specifikációk, tartozékok (kábelek, tok, adapter stb.).
- Hibák/hiányok: ha van bármilyen karc vagy gyári hiba, tüntesd fel.
- Árképzés indoklása: írj rövid összehasonlítást vagy indoklást a 20 000 Ft-ról, hogy ne tűnjön szokatlanul olcsónak/érdekesnek.
- Képek és videó: több fotó különböző szögekből (front, hát, csatlakozók, címkék, sorozatszám) és egy rövid videódemó a hangszer hangjáról és működéséről.
- Kategória: válassz pontosabb kategóriát a „Egyéb” helyett, hogy a vevők könnyebben megtalálják.

Ezekkel növeled a hirdetés hitelességét és jelentősen csökkented a vevők bizonytalanságát.');
INSERT INTO "media" ("id","listing_id","url","type") VALUES (1,1,'guitar1.webp','image'),
 (2,1,'guitar2.webp','image'),
 (3,1,'guitar3.webp','image'),
 (4,2,'piano1.webp','image'),
 (5,2,'piano2.webp','image'),
 (6,2,'piano3.webp','image'),
 (7,3,'acoustic1.webp','image'),
 (8,3,'acoustic2.webp','image'),
 (10,5,'amp1.webp','image'),
 (11,5,'amp2.webp','image'),
 (12,6,'strings1.webp','image'),
 (13,6,'strings2.webp','image'),
 (14,6,'strings3.webp','image'),
 (15,7,'behringer_mixer.webp','image'),
 (16,8,'boss.webp','image'),
 (17,9,'capo.webp','image'),
 (18,10,'casio_sustain.webp','image'),
 (19,11,'drum_throne.webp','image'),
 (20,12,'interface.webp','image'),
 (21,13,'jazz_bass.webp','image'),
 (22,14,'mg10g.webp','image'),
 (23,15,'paiste.webp','image'),
 (24,16,'shure.webp','image'),
 (28,19,'1769773732293-cat (1).webp','image');
INSERT INTO "messages" ("id","sent_from","sent_to","listing_id","content","created_at","reply_to") VALUES (1,2,1,2,'szia','2026-02-05 07:50:19',NULL),
 (2,2,1,2,'hello uram','2026-02-05 07:53:02',1),
 (3,1,2,2,'hello','2026-02-19 11:35:53',2),
 (4,1,2,2,'sznia','2026-02-19 11:36:37',NULL),
 (5,1,2,2,'asd','2026-02-19 11:38:04',NULL),
 (6,1,2,2,'ezt admin írta','2026-02-19 11:42:02',NULL),
 (7,2,1,2,'ezt marci','2026-02-19 11:42:18',6);
INSERT INTO "sessions" ("session_id","user_id","expires") VALUES ('3a5b591b-1bd7-4d40-82c2-50343264c22c',2,'2025-12-18T08:58:30.423Z'),
 ('7ba5060a-4499-4f0c-80d5-51c7e5212090',2,'2025-12-18T08:58:37.648Z'),
 ('b6e5e8bf-8aa7-47a5-8751-4a8e8ca20c18',2,'2025-12-18T09:08:48.568Z'),
 ('e3342307-a6fe-46ae-bc9f-1c133ea469cc',6,'2025-12-18T10:10:41.640Z'),
 ('d63cdf1f-f1af-4cc2-946a-afd8c8969779',4,'2025-12-18T12:42:06.375Z'),
 ('7b04534b-30db-4e6e-bdb2-baaad8f122ff',1,'2025-12-18T12:42:17.149Z'),
 ('41988eab-bf22-4fa0-bd96-9538f7faded5',1,'2025-12-18T12:43:40.378Z'),
 ('84900d51-f94c-4ef8-8352-f54dd00e347a',1,'2025-12-18T15:34:10.010Z'),
 ('89568b86-5319-4dbf-ac22-d2468a242db1',2,'2025-12-25T10:20:15.132Z'),
 ('1d0c3f23-3b34-4f3e-a40e-f6eb474ed7b9',6,'2026-01-12T17:56:43.065Z'),
 ('d1d30365-0c08-4389-ab96-66856594ac85',1,'2026-01-12T18:03:22.112Z'),
 ('b9c1bf89-d4f7-4070-b005-f0f82e6d5dd1',6,'2026-01-12T18:04:53.248Z'),
 ('ef50026c-2e5d-4cc5-80f9-0f01bc93d6b5',6,'2026-01-12T18:06:57.920Z'),
 ('6f34ca20-3095-479a-b8c9-44b7a884ace6',6,'2026-01-12T18:19:32.212Z'),
 ('036e66d2-b120-4bb9-ad22-6d61b3f187f6',1,'2026-01-20T10:30:04.936Z'),
 ('fbd38a19-3f6e-4bf4-a07b-96f6724fb7c4',2,'2026-01-28T09:47:13.402Z'),
 ('ba2e42d4-abdf-49df-b8a5-170703ec683b',2,'2026-01-28T10:52:30.162Z'),
 ('9f7cf39e-464a-46a3-9ba0-eac6fab52473',1,'2026-01-30T08:41:13.052Z'),
 ('05786de6-91eb-4de2-bb68-a99cfb10c17b',2,'2026-02-02T08:42:26.486Z'),
 ('a23b7f5f-4eeb-46f2-a02c-921304a4c022',2,'2026-02-02T12:12:57.187Z'),
 ('bf509cf1-c171-411b-baff-7255f5780641',1,'2026-02-05T11:37:31.337Z'),
 ('798d6e40-a5ac-4832-b442-934d879e5d9d',1,'2026-02-05T12:32:26.513Z'),
 ('90a29a6e-0453-461d-b9b2-6ac6f76af4ca',1,'2026-02-05T18:04:09.917Z'),
 ('e850936f-95bb-4935-a4c9-735bd2181c67',5,'2026-02-08T08:20:46.036Z'),
 ('0a1e01de-33a2-4364-a100-2732307f9ba9',1,'2026-02-06T11:46:42.404Z'),
 ('8b3062e3-5a17-4f01-b50e-683ec78d89d2',2,'2026-02-08T09:11:29.977Z'),
 ('9b906d9e-35ed-4be4-bf41-4a13f5bbe9ff',2,'2026-02-12T10:00:24.328Z'),
 ('947f1cab-9979-4353-88f6-5c60225afd84',2,'2026-02-27T15:30:07.885Z');
INSERT INTO "transactions" ("id","sent_from","sent_to","price","status","created_at","completed_at","listing_id") VALUES (1,2,1,8.0,'completed','2026-01-29 19:50:26',NULL,18),
 (2,5,1,35000.0,'completed','2026-01-30 11:53:24',NULL,1),
 (3,5,1,40000.0,'completed','2026-01-30 11:53:24',NULL,5),
 (4,5,1,2500.0,'completed','2026-01-30 11:53:24',NULL,9),
 (5,2,1,10000.0,'completed','2026-02-04 12:43:02',NULL,3),
 (6,2,1,10000.0,'completed','2026-02-04 13:00:00',NULL,3);
INSERT INTO "user_stats" ("user_id","total_listings","total_sold","total_spent","total_earned","last_login","active_listings","rating_count","total_reviews") VALUES (1,5,17,0.0,122072.0,'2026-02-19 11:15:27',16,0,0),
 (2,17,0,10072.0,0.0,'2026-02-20 15:24:48',0,0,0),
 (3,2,0,0.0,0.0,'2026-01-29 19:50:09',0,0,0),
 (4,0,0,0.0,0.0,NULL,0,0,0);
INSERT INTO "users" ("id","name","pass_hash","location","rating","join_date","email","email_verified","profile_url","bio","role","status","phone") VALUES (1,'admin','$2b$10$vjw5b8kCy68m9GOkfEaCiuHqiE/aSyGsHsm.q/XX1.hY0d9cL5uQu','home',NULL,'2025-11-02 15:47:37','example@gmail.com',1,'default_avatar.png',NULL,'admin','active',NULL);
CREATE TRIGGER listings_after_delete
AFTER DELETE ON listings
WHEN OLD.user_id IS NOT NULL
BEGIN
  UPDATE user_stats
  SET active_listings = active_listings - (OLD.status='active'),
      total_sold = total_sold + (OLD.status='sold')
  WHERE user_id = OLD.user_id;
END;
CREATE TRIGGER listings_after_insert
AFTER INSERT ON listings
WHEN NEW.user_id IS NOT NULL
BEGIN
  UPDATE user_stats
  SET total_listings = total_listings + 1
  WHERE user_id = NEW.user_id;
END;
CREATE TRIGGER listings_after_status_update
AFTER UPDATE OF status ON listings
WHEN OLD.user_id IS NOT NULL AND OLD.status != NEW.status
BEGIN
  UPDATE user_stats
  SET active_listings = active_listings - (OLD.status='active') + (NEW.status='active'),
      total_sold = total_sold + (NEW.status='sold') - (OLD.status='sold')
  WHERE user_id = OLD.user_id;
END;
CREATE TRIGGER transactions_after_insert
AFTER INSERT ON transactions
WHEN NEW.sent_from IS NOT NULL AND NEW.sent_to IS NOT NULL
BEGIN
  UPDATE user_stats
  SET total_spent = total_spent + NEW.price
  WHERE user_id = NEW.sent_from;

  UPDATE user_stats
  SET total_earned = total_earned + NEW.price,
  total_sold = total_sold + 1
  WHERE user_id = NEW.sent_to;
END;
COMMIT;
