//kód az ai ratingekhez.
const db = require("./db.js");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config({quiet:true});

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
        const sql = `
                    SELECT
                l.title,
                l.description,
                l.price,
                l.created_at,
                l.condition,
                l.brand,
                l.model,
                l.ai_rating,
                l.ai_reviewed,
                l.ai_feedback,
                c.name AS category,

                COUNT(DISTINCT mi.id) AS image_count,
                COUNT(DISTINCT mv.id) AS video_count

            FROM listings l
            JOIN categories c 
                ON c.id = l.category_id

            LEFT JOIN media mi 
                ON mi.listing_id = l.id 
                AND mi.type = 'image'

            LEFT JOIN media mv 
                ON mv.listing_id = l.id 
                AND mv.type = 'video'

            WHERE l.id = ?

            GROUP BY
                l.id,
                c.name;

        
        `;

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
                        Egy asszisztens vagy, amely használt hangszerek hirdetéseit értékeli egy online piactéren.

                        A feladatod egyetlen hirdetés elemzése és az alábbiak visszaadása:
                        1) Egy 0.0–5.0 közötti numerikus értékelés (legfeljebb 1 tizedesjegy)
                        2) Rövid, hasznos, építő jellegű visszajelzés Markdown formátumban

                        A hirdetés adatait JSON objektumban kapod.  
                        NEM látod a képeket vagy videókat, csak:
                        - a számukat
                        - a fájlneveket

                        ### Értékelési szempontok
                        - Ár realitása a márkához, modellhez, állapothoz és kategóriához képest  
                        - Cím és leírás informatív, világos, részletes-e  
                        - Tartalmazza-e a kulcsfontosságú infókat (állapot, specifikációk, hibák, eredetiség)  
                        - Eladó erőfeszítése és megbízhatósága (képek/videók megléte, kommunikáció egyértelműsége)

                        ### Értékelési skála
                        - **0.0** → Elutasítva: súlyosan hiányos vagy félrevezető  
                        - **1.0–1.9** → Nagyon gyenge: komoly infóhiány, nehéz értékelni  
                        - **2.0–2.9** → Átlag alatti: van infó, de fontos részletek hiányoznak  
                        - **3.0–3.9** → Elfogadható: alapvetően rendben, de javítható  
                        - **4.0–4.4** → Nagyon jó: informatív, korrekt ár  
                        - **4.5–5.0** → Kiváló: minden szükséges infó, esetleg extra részletekkel

                        ### Fontos szabályok
                        - Ne feltételezz hiányzó infót  
                        - Ne értékeld a képek/videók minőségét, csak meglétüket  
                        - Rövid, semmitmondó leírás csökkenti az értékelést  
                        - Visszajelzés legyen konkrét és javításra ösztönző  
                        - Pénznem: magyar Forint  
                        - Vedd figyelembe az előző értékelést

                        ### Kimeneti formátum (CSAK JSON)
                        json
                        {
                        "rating": number,
                        "feedback": "Markdownban, rövid, hasznos visszajelzés"
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

            if (rating == null) {
                console.log("No response from ai");
                console.log("message: " + JSON.stringify(data.choices[0].message.content))
                return;
            }

            //set listing data.
            const sqlUpdate = `UPDATE listings SET ai_rating = ?, ai_feedback = ?, ai_reviewed = 1, status = 'active' WHERE id = ?`;
            db.run(sqlUpdate, [rating, feedback, listing_id], function (err) {
                if (err) return reject("Failed to update AI rating");

                //console.log("AI rating updated");

                //delete from ai_queue
                const sqlDelete = `DELETE FROM ai_queue WHERE id = ?`;
                db.run(sqlDelete, [rating_id], function (err) {
                    if (err) return reject("Failed to delete from AI queue");

                    //console.log("AI queue item deleted");
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

        let count = 0;

        for (const listing of listings) {
            count++;
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
            console.log(`${count}/${listings.length}`);
            await sleep(5 * 1000);
        }

        console.log(`Rating completed. ✅`);

    } catch (err) {
        console.error("AI runner error:", err);
    }
}

//run every 10 mins IF NOT TEST
if (process.env.NODE_ENV !== 'test') {
  aiInterval = setInterval(runAI, timer_minutes * 60 * 1000);
  runAI();
}
