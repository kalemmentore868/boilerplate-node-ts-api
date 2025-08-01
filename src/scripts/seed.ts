import "dotenv/config";
import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { Orders, Customers, Products } from "../db/schema";
import { faker } from "@faker-js/faker";

(async () => {
  console.log("🔄 Starting data update script...");

  // 1) Update delivery info on all orders from customer address
  console.log("📦 Updating order delivery info...");
  await db.execute(sql`
    UPDATE ${Orders} o
    SET
      delivery_street  = c.street,
      delivery_city    = c.city,
      delivery_state   = c.state,
      delivery_postal  = c.postal_code,
      delivery_country = c.country
    FROM ${Customers} c
    WHERE o.customer_id = c.id;
  `);
  console.log("✅ Order delivery info updated.");

  // 2) Update product names by category with varied unique names
  console.log("🎨 Updating product names with unique titles...");
  // Fetch all products
  const products = await db.select().from(Products).execute();
  for (const prod of products) {
    let newName: string;
    switch (prod.category) {
      case "trucks":
        newName = `${faker.vehicle.manufacturer()} ${faker.vehicle.model()} Truck`;
        break;
      case "lego_sets":
        newName = `LEGO ${faker.word.noun()} Set`;
        break;
      case "scooters":
        newName = `${faker.vehicle.color()} Scooter`;
        break;
      case "stuffed_animals":
        newName = `${faker.animal.type()} Plush`;
        break;
      case "dolls":
        newName = `${faker.person.firstName()} Doll`;
        break;
      case "kitchen_sets":
        newName = `${faker.commerce.productAdjective()} Kitchen Set`;
        break;
      case "jewelry_kits":
        newName = `${faker.commerce.productAdjective()} Jewelry Kit`;
        break;
      default:
        newName = prod.name;
    }
    // Update each product
    await db
      .update(Products)
      .set({ name: newName })
      .where(eq(Products.id, prod.id));
  }
  console.log("✅ Product names updated.");

  console.log("🎉 Data update complete!");
  process.exit(0);
})();
