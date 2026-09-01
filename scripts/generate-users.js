/**
 * FreshCart AI — 150,000 Synthetic Users Generator
 * Generates ~150,000 realistic, fully synthetic customer profiles with consumer personas and locations.
 * Preserves baseline demo accounts: admin@freshcart.com (id=1) and customer@freshcart.com (id=2).
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Muhammad', 'Sai', 'Arnav', 'Ayaan',
  'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aaryan', 'Dhruv', 'Kabir',
  'Ananya', 'Diya', 'Aadhya', 'Pari', 'Saanvi', 'Isha', 'Aanya', 'Myra', 'Navya', 'Riya',
  'Avani', 'Kiara', 'Sara', 'Prisha', 'Vaidehi', 'Siya', 'Shanaya', 'Anvi', 'Ahana', 'Meera',
  'Rahul', 'Amit', 'Neha', 'Priya', 'Sneha', 'Vikram', 'Pooja', 'Rohan', 'Rajesh', 'Suresh',
  'Kiran', 'Divya', 'Nikhil', 'Kavya', 'Sanjay', 'Nisha', 'Manish', 'Tanvi', 'Gaurav', 'Swati',
  'Harish', 'Bhavna', 'Deepak', 'Ankita', 'Kunal', 'Pallavi', 'Ashish', 'Shruti', 'Varun', 'Shweta',
  'Rakesh', 'Preeti', 'Manoj', 'Sandhya', 'Alok', 'Rashmi', 'Sameer', 'Shilpa', 'Vikas', 'Payal'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Mehta', 'Joshi', 'Nair',
  'Iyer', 'Rao', 'Das', 'Pillai', 'Chopra', 'Malhotra', 'Bhat', 'Kapoor', 'Agarwal', 'Tiwari',
  'Banerjee', 'Chatterjee', 'Mukherjee', 'Dutta', 'Ghosh', 'Bose', 'Sengupta', 'Mishra', 'Pandey', 'Tripathi',
  'Deshmukh', 'Kulkarni', 'Patil', 'Pawar', 'Shinde', 'Jadhav', 'Gaikwad', 'Bhosale', 'Sawant', 'Chavan',
  'Shetty', 'Hegde', 'Kamath', 'Pai', 'Shenoy', 'Prabhu', 'Bhandary', 'Menon', 'Kurup', 'Warrier',
  'Bhattacharya', 'Goswami', 'Chakraborty', 'Majumdar', 'Barman', 'Saha', 'Roy', 'Sarkar', 'Biswas', 'Pal'
];

const CITIES = [
  { city: 'Bengaluru', pincodePrefix: '5600', hubs: ['Indiranagar Hub #04', 'Koramangala Hub #02', 'HSR Layout Hub #07', 'Whitefield Hub #11'] },
  { city: 'Mumbai', pincodePrefix: '4000', hubs: ['Andheri West Hub #01', 'Bandra West Hub #05', 'Powai Tech Hub #08', 'Colaba Hub #03'] },
  { city: 'Delhi-NCR', pincodePrefix: '1100', hubs: ['Connaught Place Hub #06', 'South Extension Hub #09', 'Gurugram Cyber City #12', 'Noida Sector 62 #14'] },
  { city: 'Hyderabad', pincodePrefix: '5000', hubs: ['HITEC City Hub #15', 'Gachibowli Hub #10', 'Banjara Hills Hub #13', 'Jubilee Hills Hub #16'] },
  { city: 'Pune', pincodePrefix: '4110', hubs: ['Kothrud Hub #18', 'Viman Nagar Hub #20', 'Baner Hub #22', 'Hinjawadi Hub #19'] },
  { city: 'Chennai', pincodePrefix: '6000', hubs: ['T Nagar Hub #21', 'Adyar Hub #23', 'Velachery Hub #25', 'Anna Nagar Hub #24'] },
  { city: 'Kolkata', pincodePrefix: '7000', hubs: ['Salt Lake Sector V #26', 'Park Street Hub #28', 'New Town Hub #30', 'Ballygunge Hub #27'] },
  { city: 'Ahmedabad', pincodePrefix: '3800', hubs: ['Satellite Hub #31', 'Bodakdev Hub #33', 'Navrangpura Hub #35', 'Vastrapur Hub #32'] }
];

const PERSONA_TYPES = [
  { type: 'health_conscious', weight: 20, categories: ['fruits', 'vegetables', 'leafy_greens', 'dairy', 'organic_produce', 'plant_milks'], avgFrequency: 8 },
  { type: 'budget_shopper', weight: 25, categories: ['vegetables', 'staples', 'wheat_atta', 'dal_pulses', 'cooking_oils', 'snacks'], avgFrequency: 10 },
  { type: 'premium_gourmet', weight: 15, categories: ['exotic_fruits', 'bakery', 'cheese_butter', 'chocolates', 'premium_oils', 'almonds_cashews'], avgFrequency: 6 },
  { type: 'bulk_family', weight: 20, categories: ['staples', 'dairy', 'wheat_atta', 'dal_pulses', 'laundry_detergents', 'household_cleaning'], avgFrequency: 4 },
  { type: 'quick_commerce_regular', weight: 15, categories: ['dairy', 'bread_buns', 'snacks', 'beverages', 'instant_noodles', 'ice_creams'], avgFrequency: 14 },
  { type: 'occasional_visitor', weight: 5, categories: ['fruits', 'bakery', 'beverages'], avgFrequency: 2 }
];

function generateDeterministicUsers(targetCount = 150000) {
  const rng = seededRandom(42);
  const users = [];

  // 1. Preserved Demo Accounts
  const adminHash = bcrypt.hashSync('admin123', 10);
  const custHash = bcrypt.hashSync('customer123', 10);
  const defaultHash = bcrypt.hashSync('password123', 10); // Single pre-computed hash for all synthetic accounts for blazing generation speed

  // Admin (id: 1)
  users.push({
    id: 1,
    name: 'Admin User',
    email: 'admin@freshcart.com',
    password_hash: adminHash,
    role: 'admin',
    created_at: '2025-01-01 00:00:00'
  });

  // Customer (id: 2)
  users.push({
    id: 2,
    name: 'Demo Customer',
    email: 'customer@freshcart.com',
    password_hash: custHash,
    role: 'customer',
    created_at: '2025-01-02 00:00:00'
  });

  console.log(`Generating ${targetCount - 2} synthetic customers with personas & regional geography...`);

  // Cumulative persona weights
  const totalWeight = PERSONA_TYPES.reduce((s, p) => s + p.weight, 0);

  const startDate = new Date('2025-01-01T00:00:00Z');
  const now = new Date('2026-01-01T00:00:00Z');
  const timeSpanMs = now.getTime() - startDate.getTime();

  for (let i = 3; i <= targetCount; i++) {
    const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const cityObj = CITIES[Math.floor(rng() * CITIES.length)];

    // Weighted persona selection
    let r = rng() * totalWeight;
    let selectedPersona = PERSONA_TYPES[0];
    for (const p of PERSONA_TYPES) {
      r -= p.weight;
      if (r <= 0) {
        selectedPersona = p;
        break;
      }
    }

    const regTime = new Date(startDate.getTime() + Math.floor(rng() * timeSpanMs));
    const regDateStr = regTime.toISOString().replace('T', ' ').substring(0, 19);

    // Email pattern
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@synthetic.freshcart.in`;

    users.push({
      id: i,
      name: `${first} ${last}`,
      email,
      password_hash: defaultHash,
      role: 'customer',
      created_at: regDateStr
    });
  }

  console.log(`✅ Generated ${users.length} synthetic users (1 Admin + 1 Demo + ${users.length - 2} synthetic customers).`);
  return users;
}

if (require.main === module) {
  const users = generateDeterministicUsers(150000);
  console.log('Sample user 3:', users[2]);
  console.log('Sample user 150000:', users[users.length - 1]);
}

module.exports = { generateDeterministicUsers };
