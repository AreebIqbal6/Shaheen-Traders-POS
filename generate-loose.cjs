const fs = require('fs');

const categories = {
  vegetables: [
    ['Onions', '🧅', 150], ['Potatoes', '🥔', 100], ['Tomatoes', '🍅', 200], ['Garlic', '🧄', 80],
    ['Ginger', '🫚', 150], ['Green Chillies', '🌶️', 50], ['Lemons', '🍋', 120], ['Carrots', '🥕', 120],
    ['Cabbage', '🥬', 80], ['Cauliflower', '🥦', 150], ['Spinach', '🥬', 60], ['Coriander Leaves', '🌿', 30],
    ['Mint Leaves', '🌿', 30], ['Eggplant', '🍆', 90], ['Okra (Bhindi)', '🥒', 130], ['Cucumber', '🥒', 80],
    ['Radish', '🥕', 50], ['Turnip', '🧅', 70], ['Bitter Gourd', '🥒', 120], ['Bottle Gourd', '🥒', 60],
    ['Peas', '🫛', 250], ['Bell Pepper', '🫑', 300], ['Beetroot', '🍠', 100], ['Sweet Potato', '🍠', 90],
    ['Pumpkin', '🎃', 70], ['Green Beans', '🫘', 150]
  ],
  fruits: [
    ['Apples', '🍎', 300], ['Bananas', '🍌', 180], ['Mangoes', '🥭', 250], ['Watermelon', '🍉', 400],
    ['Oranges', '🍊', 200], ['Grapes', '🍇', 350], ['Pomegranate', '🔴', 450], ['Papaya', '🍈', 150],
    ['Guava', '🍐', 120], ['Peach', '🍑', 250], ['Plum', '🍑', 200], ['Apricot', '🍑', 300],
    ['Melon', '🍈', 200], ['Strawberries', '🍓', 500], ['Cherries', '🍒', 800], ['Pineapple', '🍍', 350]
  ],
  flours: [
    ['Chakki Atta', '🌾', 1400], ['Fine Atta', '🌾', 1350], ['Maida', '🥟', 150], ['Besan', '🥣', 200],
    ['Corn Flour', '🌽', 180], ['Rice Flour', '🍚', 200], ['Bajara Atta', '🌾', 160], ['Jowar Atta', '🌾', 170],
    ['Suji (Semolina)', '🥣', 140]
  ],
  spices: [
    ['Red Chilli Powder', '🌶️', 250], ['Turmeric Powder', '🫙', 200], ['Coriander Powder', '🌿', 180],
    ['Cumin Seeds (Zeera)', '🫘', 400], ['Garam Masala', '🫙', 500], ['Black Pepper Whole', '🫘', 800],
    ['Black Pepper Powder', '🫙', 850], ['Cloves (Laung)', '🫘', 1200], ['Cardamom (Elaichi)', '🌿', 3500],
    ['Cinnamon (Darchini)', '🪵', 600], ['Bay Leaves (Tez Patta)', '🍃', 200], ['Mustard Seeds', '🫘', 150],
    ['Fenugreek (Methi)', '🌿', 180], ['Ajwain', '🫘', 250], ['Fennel Seeds (Saunf)', '🌿', 300],
    ['Star Anise', '⭐', 1500], ['Mace (Javitri)', '🫙', 2000], ['Nutmeg (Jaifal)', '🥥', 1800],
    ['Biryani Masala', '📦', 90], ['Karahi Masala', '📦', 90], ['Tikka Masala', '📦', 90],
    ['Qorma Masala', '📦', 90], ['Chaat Masala', '📦', 80], ['Nihari Masala', '📦', 100]
  ],
  dals: [
    ['Chana Dal', '🍲', 280], ['Masoor Dal', '🥣', 320], ['Moong Dal', '🍲', 300], ['Mash Dal', '🥣', 400],
    ['White Chana (Kabuli)', '🫘', 350], ['Black Chana', '🫘', 250], ['Red Beans (Rajma)', '🫘', 450],
    ['Lobia (White)', '🫘', 300], ['Mix Dal', '🍲', 320]
  ],
  rice_sugar: [
    ['Basmati Rice (Super)', '🍚', 400], ['Basmati Rice (Broken)', '🍚', 250], ['Sela Rice', '🍚', 350],
    ['Brown Rice', '🍚', 450], ['Loose Sugar', '🍬', 140], ['Brown Sugar', '🍬', 200],
    ['Gur (Jaggery)', '🪨', 180], ['Loose Salt', '🧂', 50], ['Pink Salt', '🧂', 120]
  ],
  dry_fruits: [
    ['Almonds', '🥜', 2500], ['Walnuts', '🥜', 1800], ['Cashews', '🥜', 2800], ['Pistachios', '🥜', 3000],
    ['Raisins (Kishmish)', '🍇', 800], ['Dates (Khajoor)', '🌴', 600], ['Dried Figs (Anjeer)', '🍈', 1500],
    ['Peanuts', '🥜', 400], ['Pine Nuts (Chilgoza)', '🌲', 8000]
  ],
  dairy_others: [
    ['Eggs (1 Dozen)', '🥚', 350], ['Loose Tea', '☕', 600], ['Green Tea', '🍵', 800],
    ['Loose Oil', '🛢️', 450], ['Loose Ghee', '🧈', 500], ['Desi Ghee', '🧈', 2000],
    ['Fresh Milk (1L)', '🥛', 220], ['Yogurt (1kg)', '🥣', 240], ['Paneer (250g)', '🧀', 300]
  ]
};

const items = [];

for (const cat in categories) {
  categories[cat].forEach(([name, image, price]) => {
    items.push({
      name,
      price,
      image
    });
  });
}

const fileContent = `// Auto-generated massive list of loose items
export const massiveLooseItems = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync('src/looseItems.ts', fileContent);
console.log('Successfully generated massive loose items file in src/looseItems.ts');
