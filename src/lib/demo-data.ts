import { Product, User } from "@/types";

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Coffee - Espresso",
    price: 3.5,
    cost: 0.8,
    category: "Beverages",
    stock: 100,
    description: "Rich and bold espresso shot",
  },
  {
    id: "2",
    name: "Coffee - Latte",
    price: 4.5,
    cost: 1.2,
    category: "Beverages",
    stock: 85,
    description: "Smooth espresso with steamed milk",
  },
  {
    id: "3",
    name: "Croissant",
    price: 2.75,
    cost: 0.9,
    category: "Pastries",
    stock: 25,
    description: "Buttery, flaky pastry",
  },
  {
    id: "4",
    name: "Sandwich - Turkey",
    price: 8.99,
    cost: 3.5,
    category: "Food",
    stock: 15,
    description: "Fresh turkey sandwich with lettuce and tomato",
  },
  {
    id: "5",
    name: "Muffin - Blueberry",
    price: 3.25,
    cost: 1.1,
    category: "Pastries",
    stock: 20,
    description: "Fresh baked blueberry muffin",
  },
  {
    id: "6",
    name: "Juice - Orange",
    price: 3.99,
    cost: 1.5,
    category: "Beverages",
    stock: 30,
    description: "Fresh squeezed orange juice",
  },
  {
    id: "7",
    name: "Salad - Caesar",
    price: 9.5,
    cost: 3.8,
    category: "Food",
    stock: 12,
    description: "Classic Caesar salad with croutons",
  },
  {
    id: "8",
    name: "Tea - Green",
    price: 2.99,
    cost: 0.6,
    category: "Beverages",
    stock: 50,
    description: "Organic green tea",
  },
];
export const DEMO_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    role: "admin",
    name: "John Admin",
    email: "admin@store.com",
    isActive: true,
  },
  {
    id: "2",
    username: "cashier1",
    role: "cashier",
    name: "Sarah Johnson",
    email: "sarah@store.com",
    isActive: true,
  },
  {
    id: "3",
    username: "manager1",
    role: "manager",
    name: "Mike Manager",
    email: "mike@store.com",
    isActive: true,
  },
];

// Add this to the end of src/lib/demo-data.ts
import { Sale } from "@/types";

export const DEMO_SALES: Sale[] = [
  {
    id: "sale_1",
    items: [
      { product: DEMO_PRODUCTS[0], quantity: 2 },
      { product: DEMO_PRODUCTS[2], quantity: 1 },
    ],
    total: 10.75,
    profit: 5.25,
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
    userId: "2",
    paymentMethod: "card",
  },
  {
    id: "sale_2",
    items: [{ product: DEMO_PRODUCTS[1], quantity: 1 }],
    total: 4.5,
    profit: 3.3,
    timestamp: new Date(), // Today
    userId: "2",
    paymentMethod: "cash",
  },
];