export interface FoodItem {
  name: string;
  aliases: string[];
  caloriesPer100g: number;
  proteinsPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  defaultPortionG: number;
  category: string;
}

export const FOOD_DATABASE: FoodItem[] = [
  // Protéines
  { name: "Poulet (blanc)", aliases: ["poulet", "chicken", "blanc de poulet", "filet de poulet"], caloriesPer100g: 165, proteinsPer100g: 31, carbsPer100g: 0, fatsPer100g: 3.6, defaultPortionG: 150, category: "protéines" },
  { name: "Steak haché 5%", aliases: ["steak", "boeuf haché", "steak haché"], caloriesPer100g: 137, proteinsPer100g: 26, carbsPer100g: 0, fatsPer100g: 5, defaultPortionG: 125, category: "protéines" },
  { name: "Saumon", aliases: ["saumon", "pavé de saumon", "salmon"], caloriesPer100g: 208, proteinsPer100g: 20, carbsPer100g: 0, fatsPer100g: 13, defaultPortionG: 150, category: "protéines" },
  { name: "Thon en boîte", aliases: ["thon", "tuna"], caloriesPer100g: 116, proteinsPer100g: 26, carbsPer100g: 0, fatsPer100g: 1, defaultPortionG: 130, category: "protéines" },
  { name: "Oeufs", aliases: ["oeuf", "egg", "oeufs", "œuf", "œufs"], caloriesPer100g: 155, proteinsPer100g: 13, carbsPer100g: 1.1, fatsPer100g: 11, defaultPortionG: 60, category: "protéines" },
  { name: "Whey protéine", aliases: ["whey", "protéine en poudre", "shaker"], caloriesPer100g: 400, proteinsPer100g: 80, carbsPer100g: 8, fatsPer100g: 5, defaultPortionG: 30, category: "protéines" },
  { name: "Dinde", aliases: ["dinde", "escalope de dinde", "turkey"], caloriesPer100g: 135, proteinsPer100g: 30, carbsPer100g: 0, fatsPer100g: 1, defaultPortionG: 150, category: "protéines" },
  { name: "Jambon blanc", aliases: ["jambon", "jambon blanc"], caloriesPer100g: 115, proteinsPer100g: 21, carbsPer100g: 1, fatsPer100g: 3, defaultPortionG: 40, category: "protéines" },
  { name: "Fromage blanc 0%", aliases: ["fromage blanc", "faisselle"], caloriesPer100g: 45, proteinsPer100g: 7, carbsPer100g: 4, fatsPer100g: 0, defaultPortionG: 200, category: "protéines" },
  { name: "Yaourt grec", aliases: ["yaourt grec", "greek yogurt", "skyr"], caloriesPer100g: 97, proteinsPer100g: 9, carbsPer100g: 3.6, fatsPer100g: 5, defaultPortionG: 170, category: "protéines" },

  // Féculents
  { name: "Riz blanc (cuit)", aliases: ["riz", "riz blanc", "rice"], caloriesPer100g: 130, proteinsPer100g: 2.7, carbsPer100g: 28, fatsPer100g: 0.3, defaultPortionG: 200, category: "féculents" },
  { name: "Riz complet (cuit)", aliases: ["riz complet", "riz brun", "brown rice"], caloriesPer100g: 123, proteinsPer100g: 2.7, carbsPer100g: 26, fatsPer100g: 1, defaultPortionG: 200, category: "féculents" },
  { name: "Pâtes (cuites)", aliases: ["pâtes", "pasta", "spaghetti", "penne", "fusilli"], caloriesPer100g: 131, proteinsPer100g: 5, carbsPer100g: 25, fatsPer100g: 1.1, defaultPortionG: 200, category: "féculents" },
  { name: "Pomme de terre", aliases: ["pomme de terre", "patate", "potato"], caloriesPer100g: 77, proteinsPer100g: 2, carbsPer100g: 17, fatsPer100g: 0.1, defaultPortionG: 200, category: "féculents" },
  { name: "Patate douce", aliases: ["patate douce", "sweet potato"], caloriesPer100g: 86, proteinsPer100g: 1.6, carbsPer100g: 20, fatsPer100g: 0.1, defaultPortionG: 200, category: "féculents" },
  { name: "Pain complet", aliases: ["pain", "pain complet", "bread"], caloriesPer100g: 247, proteinsPer100g: 13, carbsPer100g: 41, fatsPer100g: 3.4, defaultPortionG: 60, category: "féculents" },
  { name: "Pain blanc", aliases: ["pain blanc", "baguette"], caloriesPer100g: 265, proteinsPer100g: 9, carbsPer100g: 49, fatsPer100g: 3.2, defaultPortionG: 60, category: "féculents" },
  { name: "Avoine", aliases: ["avoine", "flocons d'avoine", "oats", "porridge"], caloriesPer100g: 389, proteinsPer100g: 17, carbsPer100g: 66, fatsPer100g: 7, defaultPortionG: 50, category: "féculents" },
  { name: "Quinoa (cuit)", aliases: ["quinoa"], caloriesPer100g: 120, proteinsPer100g: 4.4, carbsPer100g: 21, fatsPer100g: 1.9, defaultPortionG: 200, category: "féculents" },

  // Légumes
  { name: "Brocoli", aliases: ["brocoli", "broccoli"], caloriesPer100g: 34, proteinsPer100g: 2.8, carbsPer100g: 7, fatsPer100g: 0.4, defaultPortionG: 150, category: "légumes" },
  { name: "Haricots verts", aliases: ["haricots verts", "green beans"], caloriesPer100g: 31, proteinsPer100g: 1.8, carbsPer100g: 7, fatsPer100g: 0.1, defaultPortionG: 150, category: "légumes" },
  { name: "Salade verte", aliases: ["salade", "laitue", "salade verte"], caloriesPer100g: 15, proteinsPer100g: 1.4, carbsPer100g: 2.9, fatsPer100g: 0.2, defaultPortionG: 100, category: "légumes" },
  { name: "Tomate", aliases: ["tomate", "tomates", "tomato"], caloriesPer100g: 18, proteinsPer100g: 0.9, carbsPer100g: 3.9, fatsPer100g: 0.2, defaultPortionG: 150, category: "légumes" },
  { name: "Courgette", aliases: ["courgette", "zucchini"], caloriesPer100g: 17, proteinsPer100g: 1.2, carbsPer100g: 3.1, fatsPer100g: 0.3, defaultPortionG: 200, category: "légumes" },
  { name: "Épinards", aliases: ["épinards", "spinach"], caloriesPer100g: 23, proteinsPer100g: 2.9, carbsPer100g: 3.6, fatsPer100g: 0.4, defaultPortionG: 100, category: "légumes" },
  { name: "Carotte", aliases: ["carotte", "carottes"], caloriesPer100g: 41, proteinsPer100g: 0.9, carbsPer100g: 10, fatsPer100g: 0.2, defaultPortionG: 120, category: "légumes" },

  // Fruits
  { name: "Banane", aliases: ["banane", "banana"], caloriesPer100g: 89, proteinsPer100g: 1.1, carbsPer100g: 23, fatsPer100g: 0.3, defaultPortionG: 120, category: "fruits" },
  { name: "Pomme", aliases: ["pomme", "apple"], caloriesPer100g: 52, proteinsPer100g: 0.3, carbsPer100g: 14, fatsPer100g: 0.2, defaultPortionG: 180, category: "fruits" },
  { name: "Orange", aliases: ["orange"], caloriesPer100g: 47, proteinsPer100g: 0.9, carbsPer100g: 12, fatsPer100g: 0.1, defaultPortionG: 150, category: "fruits" },
  { name: "Fraises", aliases: ["fraise", "fraises", "strawberry"], caloriesPer100g: 32, proteinsPer100g: 0.7, carbsPer100g: 7.7, fatsPer100g: 0.3, defaultPortionG: 150, category: "fruits" },
  { name: "Myrtilles", aliases: ["myrtille", "myrtilles", "blueberry"], caloriesPer100g: 57, proteinsPer100g: 0.7, carbsPer100g: 14, fatsPer100g: 0.3, defaultPortionG: 100, category: "fruits" },

  // Matières grasses
  { name: "Huile d'olive", aliases: ["huile d'olive", "olive oil"], caloriesPer100g: 884, proteinsPer100g: 0, carbsPer100g: 0, fatsPer100g: 100, defaultPortionG: 10, category: "graisses" },
  { name: "Beurre de cacahuète", aliases: ["beurre de cacahuète", "peanut butter", "beurre cacahuete"], caloriesPer100g: 588, proteinsPer100g: 25, carbsPer100g: 20, fatsPer100g: 50, defaultPortionG: 20, category: "graisses" },
  { name: "Amandes", aliases: ["amandes", "almonds"], caloriesPer100g: 579, proteinsPer100g: 21, carbsPer100g: 22, fatsPer100g: 50, defaultPortionG: 30, category: "graisses" },
  { name: "Noix", aliases: ["noix", "walnuts"], caloriesPer100g: 654, proteinsPer100g: 15, carbsPer100g: 14, fatsPer100g: 65, defaultPortionG: 30, category: "graisses" },
  { name: "Avocat", aliases: ["avocat", "avocado"], caloriesPer100g: 160, proteinsPer100g: 2, carbsPer100g: 9, fatsPer100g: 15, defaultPortionG: 80, category: "graisses" },

  // Produits laitiers
  { name: "Lait demi-écrémé", aliases: ["lait", "milk"], caloriesPer100g: 46, proteinsPer100g: 3.2, carbsPer100g: 4.8, fatsPer100g: 1.5, defaultPortionG: 250, category: "laitier" },
  { name: "Emmental", aliases: ["emmental", "fromage", "cheese"], caloriesPer100g: 380, proteinsPer100g: 29, carbsPer100g: 0, fatsPer100g: 29, defaultPortionG: 30, category: "laitier" },
  { name: "Mozzarella", aliases: ["mozzarella", "mozza"], caloriesPer100g: 280, proteinsPer100g: 28, carbsPer100g: 3, fatsPer100g: 17, defaultPortionG: 125, category: "laitier" },

  // Boissons
  { name: "Jus d'orange", aliases: ["jus d'orange", "orange juice"], caloriesPer100g: 45, proteinsPer100g: 0.7, carbsPer100g: 10, fatsPer100g: 0.2, defaultPortionG: 250, category: "boissons" },
  { name: "Coca-Cola", aliases: ["coca", "coca-cola", "coke"], caloriesPer100g: 42, proteinsPer100g: 0, carbsPer100g: 11, fatsPer100g: 0, defaultPortionG: 330, category: "boissons" },

  // Plats courants
  { name: "Salade Caesar", aliases: ["salade caesar", "caesar salad"], caloriesPer100g: 127, proteinsPer100g: 8, carbsPer100g: 7, fatsPer100g: 8, defaultPortionG: 300, category: "plats" },
  { name: "Sandwich jambon-beurre", aliases: ["sandwich", "jambon beurre"], caloriesPer100g: 250, proteinsPer100g: 12, carbsPer100g: 28, fatsPer100g: 10, defaultPortionG: 200, category: "plats" },
  { name: "Pizza Margherita", aliases: ["pizza", "pizza margherita"], caloriesPer100g: 266, proteinsPer100g: 11, carbsPer100g: 33, fatsPer100g: 10, defaultPortionG: 250, category: "plats" },
  { name: "Burger classique", aliases: ["burger", "hamburger"], caloriesPer100g: 254, proteinsPer100g: 13, carbsPer100g: 24, fatsPer100g: 12, defaultPortionG: 250, category: "plats" },
  { name: "Kebab", aliases: ["kebab", "döner", "doner"], caloriesPer100g: 215, proteinsPer100g: 14, carbsPer100g: 20, fatsPer100g: 9, defaultPortionG: 350, category: "plats" },
  { name: "Sushi (assortiment)", aliases: ["sushi", "maki", "sashimi"], caloriesPer100g: 143, proteinsPer100g: 6, carbsPer100g: 22, fatsPer100g: 3, defaultPortionG: 300, category: "plats" },
  { name: "Pâtes bolognaise", aliases: ["bolognaise", "bolo", "pâtes bolo"], caloriesPer100g: 130, proteinsPer100g: 7, carbsPer100g: 15, fatsPer100g: 4, defaultPortionG: 350, category: "plats" },
];

export function searchFood(query: string): FoodItem[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return FOOD_DATABASE.filter(food => {
    const name = food.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (name.includes(q)) return true;
    return food.aliases.some(alias => {
      const a = alias.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return a.includes(q);
    });
  }).slice(0, 8);
}

export function calculateNutrition(food: FoodItem, grams: number) {
  const portion = grams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * portion),
    proteins: Math.round(food.proteinsPer100g * portion * 10) / 10,
    carbs: Math.round(food.carbsPer100g * portion * 10) / 10,
    fats: Math.round(food.fatsPer100g * portion * 10) / 10,
  };
}
