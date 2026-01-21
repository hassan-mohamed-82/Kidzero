// import { db } from "../../models/db";
// import { cities } from "../../models/schema";
// import { Seed } from "../runner";
// import { sql } from "drizzle-orm";

// const defaultCities = [
//     { name: "Cairo" },
//     { name: "Alexandria" },
//     { name: "Giza" },
//     { name: "Sharm El Sheikh" },
//     { name: "Hurghada" },
//     { name: "Luxor" },
//     { name: "Aswan" },
//     { name: "Port Said" },
//     { name: "Suez" },
//     { name: "Mansoura" },
//     { name: "Tanta" },
//     { name: "Ismailia" },
//     { name: "Fayoum" },
//     { name: "Zagazig" },
//     { name: "Damanhour" },
// ];

// const seed: Seed = {
//     name: "08_cities",

//     async run() {
//         console.log("   📝 Inserting cities...");

//         for (const city of defaultCities) {
//             await db.insert(cities).values({
//                 name: city.name,
//             });
//         }

//         console.log(`   📝 Inserted ${defaultCities.length} cities`);
//     },

//     async rollback() {
//         await db.delete(cities).where(sql`1=1`);
//     },
// };

// export default seed;
