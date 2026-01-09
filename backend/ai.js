//kód az ai ratingekhez.
import db from "./db.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

//time between AI runs
const timer_minutes = 10;

//get all listings from ai_queue
function getAllListings() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM ai_queue`;
        db.all(sql, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

//rate listing and return true if successful
function rateListing(listing) {
    return new Promise((resolve, reject) => {

        //rate and return rating and feedback
        const listing_id = listing.listing_id;
        const rating_id = listing.id;
        const sql = `SELECT * FROM listings WHERE id = ?`;

        db.get(sql, [listing_id], async (err, row) => {
            if (err) return reject("Error getting listing");
            if (!row) return reject("Listing not found");

            //api call to rate listing

            const response = await fetch(
                "https://gen.pollinations.ai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "openai",
                        messages: [
                            {
                                role: "user", content: `
                        Egy asszisztens vagy, amely használt hangszerek hirdetéseit értékeli egy online piactér számára.

                        A feladatod egyetlen hirdetés elemzése és az alábbiak visszaadása:
                        1) Egy 0.0 és 5.0 közötti numerikus értékelés (valós szám, legfeljebb 1 tizedesjegy)
                        2) Rövid, építő jellegű visszajelzés arról, hogy mennyire jó a hirdetés, és hogyan lehetne javítani rajta

                        A hirdetés adatait egy JSON objektumban kapod meg. 
                        NEM látod a képeket vagy videókat, kizárólag:
                        - A képek/videók számát
                        - A fájlneveiket

                        ### Értékelési szempontok
                        Az értékelést az alábbiak alapján add meg:
                        - Az ár realitása és relevanciája a márkához, modellhez, állapothoz és kategóriához képest
                        - A cím és a leírás informativitása, egyértelműsége és részletessége
                        - Tartalmazza-e a vásárláshoz szükséges kulcsfontosságú információkat (állapot részletezése, specifikációk, hibák, eredetiség stb.)
                        - Az eladó által belefektetett munka és megbízhatóság (képek/videók megléte, kommunikáció egyértelműsége)

                        ### Értékelési skála
                        - **0.0** → Hirdetés elutasítva  
                        Súlyosan hiányos, félrevezető vagy használhatatlan. A vásárló nem tud döntést hozni. A hirdetést újra kell feltölteni.
                        - **1.0–1.9** → Nagyon gyenge  
                        Komoly információhiány, rossz leírás, nehezen megítélhető ár-érték arány.
                        - **2.0–2.9** → Átlag alatti  
                        Van némi hasznos információ, de fontos részletek hiányoznak.
                        - **3.0–3.9** → Elfogadható  
                        Alapvetően rendben van, a vásárlás megfontolható, de javítható.
                        - **4.0–4.4** → Nagyon jó  
                        Informatív, világos, korrekt ár. Nyugodtan megvennéd.
                        - **4.5–5.0** → Kiváló / tökéletes  
                        Minden szükséges információt tartalmaz a magabiztos döntéshez, esetleg extra részletekkel.

                        ### Fontos szabályok
                        - Ne feltételezz olyan információt, ami nincs megadva.
                        - Ne értékeld a képek vagy videók minőségét, csak a meglétüket és számukat.
                        - A rövid, semmitmondó leírás csökkenti az értékelést.
                        - A visszajelzés legyen konkrét, segítőkész és javításra ösztönző.

                        ### Kimeneti formátum (CSAK JSON)
                        Pontosan az alábbi struktúrát add vissza:

                        {
                        "rating": number,
                        "feedback": "rövid, hasznos visszajelzés"
                        }

                        A hírdetés: 
                        ${JSON.stringify(row)}
                        ` }
                        ],
                    }),
                }
            );

            const data = await response.json();

            //console.log(data);
            //console.log("message: " + JSON.stringify(data.choices[0].message.content))

            const ai_rating = JSON.parse(data.choices[0].message.content);

            const rating = ai_rating.rating;
            const feedback = ai_rating.feedback;

            if (!rating || !feedback) {
                console.log("No response from ai");
                return;
            }

            //set listing data.
            const sqlUpdate = `UPDATE listings SET ai_rating = ?, ai_feedback = ?, ai_reviewed = 1, status = 'active' WHERE id = ?`;
            db.run(sqlUpdate, [rating, feedback, listing_id], function (err) {
                if (err) return reject("Failed to update AI rating");

                console.log("AI rating updated");

                //delete from ai_queue
                const sqlDelete = `DELETE FROM ai_queue WHERE id = ?`;
                db.run(sqlDelete, [rating_id], function (err) {
                    if (err) return reject("Failed to delete from AI queue");

                    console.log("AI queue item deleted");
                    resolve(true);
                });
            });
        });
    });
}

async function runAI() {
    try {
        const listings = await getAllListings();

        if (listings.length <= 0) { return; }

        console.log(`Rating ${listings.length} listings...`);

        for (const listing of listings) {

            let tries = 3;
            let success = false;

            while (!success && tries > 0) {
                try {
                    await rateListing(listing);
                    success = true;
                } catch (err) {
                    console.error(err);
                    tries--;
                    await sleep(10 * 1000);
                }
            }

            await sleep(5 * 1000);
        }

        console.log(`Rating completed.`);

    } catch (err) {
        console.error("AI runner error:", err);
    }
}

//run every 10 mins
setInterval(runAI, timer_minutes * 60 * 1000);

runAI();
