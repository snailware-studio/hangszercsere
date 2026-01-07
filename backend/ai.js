//kód az ai ratingekhez.
const db = require("./db");

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
        const listing_id = listing.id;
        const sql = `SELECT * FROM listings WHERE id = ?`;

        db.get(sql, [listing_id], (err, row) => {
            if (err) return reject("Error getting listing");
            if (!row) return reject("Listing not found");

            //api call to rate listing - hardcoded for now
            const rating = 4;
            const feedback = "Great product!";

            const sqlUpdate = `UPDATE listings SET ai_rating = ?, ai_feedback = ? WHERE id = ?`;
            db.run(sqlUpdate, [rating, feedback, listing_id], function (err) {
                if (err) return reject("Failed to update AI rating");

                console.log("AI rating updated");

                //delete from ai_queue
                const sqlDelete = `DELETE FROM ai_queue WHERE id = ?`;
                db.run(sqlDelete, [listing_id], function (err) {
                    if (err) return reject("Failed to delete from AI queue");

                    console.log("AI queue item deleted");
                    resolve(true);
                });
            });
        });
    });
}

async function runAI()
{
    try {
        const listings = await getAllListings();

        if(listings.length <= 0){ return; }

        for (const listing of listings) {

            let tries = 3;
            let success = false;

            while(!success && tries > 0)
            {
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

    } catch (err) {
        console.error("AI runner error:", err);
    }
}

//run every 10 mins
setInterval(runAI, timer_minutes * 60 * 1000);

runAI();
