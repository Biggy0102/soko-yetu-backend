// Seeds the database with the static reference data from the frontend's
// js/data.js (CATEGORIES and COUNTRIES arrays), so the backend starts with
// the exact same categories/subcategories/countries the frontend already expects.
//
// Run with: node prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const COUNTRIES = [
  { code: "KE", name: "Kenya",        currency: "KES", dialCode: "+254", exampleCity: "Nairobi" },
  { code: "UG", name: "Uganda",       currency: "UGX", dialCode: "+256", exampleCity: "Kampala" },
  { code: "TZ", name: "Tanzania",     currency: "TZS", dialCode: "+255", exampleCity: "Dar es Salaam" },
  { code: "RW", name: "Rwanda",       currency: "RWF", dialCode: "+250", exampleCity: "Kigali" },
  { code: "CD", name: "Congo (DRC)",  currency: "CDF", dialCode: "+243", exampleCity: "Kinshasa" },
  { code: "BI", name: "Burundi",      currency: "BIF", dialCode: "+257", exampleCity: "Bujumbura" },
  { code: "SS", name: "South Sudan",  currency: "SSP", dialCode: "+211", exampleCity: "Juba" },
  { code: "SO", name: "Somalia",      currency: "SOS", dialCode: "+252", exampleCity: "Mogadishu" },
  { code: "ET", name: "Ethiopia",     currency: "ETB", dialCode: "+251", exampleCity: "Addis Ababa" },
];

const CATEGORIES = [
  { id: "vehicles", name: "Vehicles", icon: "🚗", subcategories: [
    { id: "cars", name: "Cars" },
    { id: "motorcycles", name: "Motorcycles & Scooters" },
    { id: "trucks", name: "Trucks & Trailers" },
    { id: "buses", name: "Buses & Vans" },
    { id: "boats", name: "Boats & Watercraft" },
    { id: "vehicle-parts", name: "Vehicle Parts & Accessories" },
    { id: "rental-vehicles", name: "Vehicles for Rent" },
  ]},
  { id: "property", name: "Property", icon: "🏠", subcategories: [
    { id: "houses-rent", name: "Houses & Apartments for Rent" },
    { id: "houses-sale", name: "Houses & Apartments for Sale" },
    { id: "land-sale", name: "Land & Plots for Sale" },
    { id: "commercial-property", name: "Commercial Property" },
    { id: "short-stay", name: "Short Stay & Airbnb" },
  ]},
  { id: "phones", name: "Phones & Tablets", icon: "📱", subcategories: [
    { id: "smartphones", name: "Mobile Phones" },
    { id: "tablets", name: "Tablets" },
    { id: "phone-accessories", name: "Phone Accessories" },
    { id: "smartwatches", name: "Smartwatches" },
  ]},
  { id: "electronics", name: "Electronics", icon: "💻", subcategories: [
    { id: "laptops", name: "Laptops & Computers" },
    { id: "tv-audio", name: "TVs & Home Audio" },
    { id: "cameras", name: "Cameras & Photography" },
    { id: "gaming", name: "Video Games & Consoles" },
    { id: "printers", name: "Printers & Office Electronics" },
  ]},
  { id: "fashion", name: "Fashion", icon: "👗", subcategories: [
    { id: "womens-clothing", name: "Women's Clothing" },
    { id: "mens-clothing", name: "Men's Clothing" },
    { id: "shoes", name: "Shoes" },
    { id: "bags", name: "Bags & Accessories" },
    { id: "jewelry", name: "Jewelry & Watches" },
  ]},
  { id: "furniture", name: "Furniture & Home", icon: "🛋️", subcategories: [
    { id: "living-room", name: "Living Room Furniture" },
    { id: "bedroom", name: "Bedroom Furniture" },
    { id: "kitchen", name: "Kitchen & Dining" },
    { id: "home-decor", name: "Home Decor" },
    { id: "appliances", name: "Home Appliances" },
  ]},
  { id: "jobs", name: "Jobs", icon: "💼", subcategories: [
    { id: "full-time", name: "Full-Time Jobs" },
    { id: "part-time", name: "Part-Time Jobs" },
    { id: "internships", name: "Internships" },
    { id: "freelance", name: "Freelance & Remote" },
    { id: "domestic", name: "Domestic Staff" },
  ]},
  { id: "services", name: "Services", icon: "🛠️", subcategories: [
    { id: "home-services", name: "Home Repair Services" },
    { id: "events", name: "Events & Catering" },
    { id: "legal-financial", name: "Legal & Financial Services" },
    { id: "transport-services", name: "Transport & Moving" },
    { id: "tech-services", name: "Tech & IT Services" },
  ]},
  { id: "beauty", name: "Beauty & Personal Care", icon: "💄", subcategories: [
    { id: "skincare", name: "Skincare" },
    { id: "makeup", name: "Makeup & Cosmetics" },
    { id: "haircare", name: "Hair Care & Wigs" },
    { id: "fragrances", name: "Fragrances" },
  ]},
  { id: "kids", name: "Babies & Kids", icon: "🧸", subcategories: [
    { id: "baby-clothing", name: "Baby & Kids Clothing" },
    { id: "toys", name: "Toys & Games" },
    { id: "strollers", name: "Strollers & Car Seats" },
    { id: "school-supplies", name: "School Supplies" },
  ]},
  { id: "agriculture", name: "Agriculture & Food", icon: "🌾", subcategories: [
    { id: "farm-produce", name: "Farm Produce" },
    { id: "livestock-feed", name: "Livestock & Animal Feed" },
    { id: "farm-machinery", name: "Farm Machinery & Tools" },
    { id: "seeds-fertilizer", name: "Seeds & Fertilizer" },
  ]},
  { id: "animals", name: "Animals & Pets", icon: "🐄", subcategories: [
    { id: "dogs", name: "Dogs" },
    { id: "cats", name: "Cats" },
    { id: "farm-animals", name: "Farm Animals" },
    { id: "pet-accessories", name: "Pet Accessories & Food" },
  ]},
  { id: "commercial", name: "Commercial Equipment", icon: "🏗️", subcategories: [
    { id: "construction-equipment", name: "Construction Equipment" },
    { id: "industrial-machinery", name: "Industrial Machinery" },
    { id: "restaurant-equipment", name: "Restaurant & Catering Equipment" },
    { id: "office-equipment", name: "Office Equipment" },
  ]},
  { id: "repair", name: "Repair & Construction", icon: "🔧", subcategories: [
    { id: "building-materials", name: "Building Materials" },
    { id: "tools", name: "Tools & Hardware" },
    { id: "electrical", name: "Electrical Supplies" },
    { id: "plumbing", name: "Plumbing Supplies" },
  ]},
  { id: "sports", name: "Sports & Outdoors", icon: "🏀", subcategories: [
    { id: "gym-equipment", name: "Gym & Fitness Equipment" },
    { id: "bicycles", name: "Bicycles" },
    { id: "camping", name: "Camping & Outdoor Gear" },
    { id: "team-sports", name: "Team Sports Equipment" },
  ]},
  { id: "education", name: "Education & Classes", icon: "📚", subcategories: [
    { id: "books", name: "Books & Textbooks" },
    { id: "tutoring", name: "Tutoring & Lessons" },
    { id: "courses", name: "Courses & Training" },
    { id: "musical-instruments", name: "Musical Instruments" },
  ]},
];

async function main() {
  console.log("Seeding countries...");
  for (const c of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  console.log("Seeding categories and subcategories...");
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, icon: cat.icon },
      create: { id: cat.id, name: cat.name, icon: cat.icon },
    });

    for (const sub of cat.subcategories) {
      await prisma.subcategory.upsert({
        where: { id: sub.id },
        update: { name: sub.name, categoryId: cat.id },
        create: { id: sub.id, name: sub.name, categoryId: cat.id },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
