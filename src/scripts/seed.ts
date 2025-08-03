// import "dotenv/config";
// import { db } from "../db";
// import { sql, eq } from "drizzle-orm";
// import { Orders, Customers, Products } from "../db/schema";
// import { faker } from "@faker-js/faker";

// (async () => {
//   console.log("🔄 Starting data update script...");

//   // 1) Update delivery info on all orders from customer address
//   console.log("📦 Updating order delivery info...");
//   await db.execute(sql`
//     UPDATE ${Orders} o
//     SET
//       delivery_street  = c.street,
//       delivery_city    = c.city,
//       delivery_state   = c.state,
//       delivery_postal  = c.postal_code,
//       delivery_country = c.country
//     FROM ${Customers} c
//     WHERE o.customer_id = c.id;
//   `);
//   console.log("✅ Order delivery info updated.");

//   // 2) Update product names by category with varied unique names
//   console.log("🎨 Updating product names with unique titles...");
//   // Fetch all products
//   const products = await db.select().from(Products).execute();
//   for (const prod of products) {
//     let newName: string;
//     switch (prod.category) {
//       case "trucks":
//         newName = `${faker.vehicle.manufacturer()} ${faker.vehicle.model()} Truck`;
//         break;
//       case "lego_sets":
//         newName = `LEGO ${faker.word.noun()} Set`;
//         break;
//       case "scooters":
//         newName = `${faker.vehicle.color()} Scooter`;
//         break;
//       case "stuffed_animals":
//         newName = `${faker.animal.type()} Plush`;
//         break;
//       case "dolls":
//         newName = `${faker.person.firstName()} Doll`;
//         break;
//       case "kitchen_sets":
//         newName = `${faker.commerce.productAdjective()} Kitchen Set`;
//         break;
//       case "jewelry_kits":
//         newName = `${faker.commerce.productAdjective()} Jewelry Kit`;
//         break;
//       default:
//         newName = prod.name;
//     }
//     // Update each product
//     await db
//       .update(Products)
//       .set({ name: newName })
//       .where(eq(Products.id, prod.id));
//   }
//   console.log("✅ Product names updated.");

//   console.log("🎉 Data update complete!");
//   process.exit(0);
// })();

// scripts/seedOrders.ts
// scripts/seedOrders.ts
import "dotenv/config";
import { db } from "../db";
import { Orders, OrderItems, Customers, Products } from "../db/schema";
import { faker } from "@faker-js/faker";

async function seedOrders() {
  console.log("🔄 Starting orders & orderItems seeding...");

  const customers = await db.select().from(Customers).execute();
  const products = await db.select().from(Products).execute();
  if (customers.length === 0 || products.length === 0) {
    console.warn("No customers or products found. Aborting.");
    return;
  }

  for (const customer of customers) {
    // 1–5 orders per customer
    const numOrders = faker.number.int({ min: 1, max: 10 });
    console.log(`→ Creating ${numOrders} orders for customer ${customer.id}`);

    for (let i = 0; i < numOrders; i++) {
      // orderDate in past 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
      const orderDate = faker.date.between({
        from: ninetyDaysAgo,
        to: new Date(),
      });

      // scheduledDeliveryDate: 7–21 days after orderDate
      const scheduledDeliveryDate = faker.date.soon({
        days: faker.number.int({ min: 7, max: 21 }),
        refDate: orderDate,
      });

      // optionally delivered 0–5 days after scheduled
      let dateDelivered: Date | null = null;
      if (faker.datatype.boolean()) {
        dateDelivered = faker.date.soon({
          days: faker.number.int({ min: 1, max: 5 }),
          refDate: scheduledDeliveryDate,
        });
      }

      // build line items
      const numItems = faker.number.int({ min: 1, max: 10 });
      const chosen = faker.helpers.arrayElements(products, numItems);
      const items = chosen.map((prod) => {
        const quantity = faker.number.int({ min: 1, max: 5 });
        const unitPrice = prod.price.toString();
        const totalPrice = (parseFloat(unitPrice) * quantity).toFixed(2);
        return { productId: prod.id, quantity, unitPrice, totalPrice };
      });

      const totalAmount = items
        .reduce((sum, x) => sum + parseFloat(x.totalPrice), 0)
        .toFixed(2);

      // Insert in a transaction
      await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(Orders)
          .values({
            customerId: customer.id,
            orderDate,
            scheduledDeliveryDate,
            dateDelivered,
            deliveryStreet: customer.street ?? faker.location.street(),
            deliveryCity: customer.city ?? faker.location.city(),
            deliveryState: customer.state ?? faker.location.state(),
            deliveryPostal: customer.postalCode ?? faker.location.zipCode(),
            deliveryCountry: customer.country ?? faker.location.country(),
            status: dateDelivered ? "delivered" : "pending",
            totalAmount,
          })
          .returning();

        await tx
          .insert(OrderItems)
          .values(
            items.map((it) => ({
              orderId: order.id,
              ...it,
            }))
          )
          .execute();
      });
    }
  }

  console.log("✅ Done seeding orders & orderItems.");
}

seedOrders()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
