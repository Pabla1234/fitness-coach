// ─── Calorie Math ─────────────────────────────────────────────────────────────

const calculateBMR = (weight, height, age, gender) => {
  const s = gender === 'Male' ? 5 : -161;
  return 10 * weight + 6.25 * height - 5 * age + s;
};

const calculateTDEE = (bmr, daysPerWeek) => {
  if (daysPerWeek >= 6) return bmr * 1.725;
  if (daysPerWeek >= 4) return bmr * 1.55;
  return bmr * 1.375;
};

// ─── 7-Day Meal Plans ─────────────────────────────────────────────────────────

const PLANS = {
  Veg_Indian_Budget: [
    [
      { name: 'Breakfast', description: 'Vegetable Poha (1.5 cups) with peanuts and lemon' },
      { name: 'Mid-Morning', description: 'Roasted chana (30g) + 1 banana' },
      { name: 'Lunch', description: 'Toor dal (1 cup) + 2 whole wheat rotis + cucumber salad' },
      { name: 'Snack', description: 'Buttermilk (1 glass) + 2 glucose biscuits' },
      { name: 'Dinner', description: 'Mixed vegetable sabzi + 2 rotis + small bowl curd' }
    ],
    [
      { name: 'Breakfast', description: 'Oats porridge (1 cup) cooked in milk with banana' },
      { name: 'Mid-Morning', description: '1 apple + handful peanuts' },
      { name: 'Lunch', description: 'Rajma (1 cup) + steamed rice (1 cup) + onion salad' },
      { name: 'Snack', description: 'Roasted makhana (small bowl)' },
      { name: 'Dinner', description: 'Paneer bhurji (100g paneer) + 2 rotis + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Vegetable Upma (1.5 cups) with coconut chutney' },
      { name: 'Mid-Morning', description: 'Seasonal fruit + 10 almonds' },
      { name: 'Lunch', description: 'Chole (1 cup) + 2 rotis + raita' },
      { name: 'Snack', description: 'Sattu drink (2 tbsp sattu in water)' },
      { name: 'Dinner', description: 'Moong dal (1 cup) + 1 cup rice + papad' }
    ],
    [
      { name: 'Breakfast', description: '2 Besan chillas with green chutney' },
      { name: 'Mid-Morning', description: 'Coconut water + 1 banana' },
      { name: 'Lunch', description: 'Dal khichdi (1.5 cups) + curd + pickle' },
      { name: 'Snack', description: 'Roasted chana (30g) + tea' },
      { name: 'Dinner', description: 'Aloo-matar sabzi + 2 rotis + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Brown bread vegetable sandwich (2 slices) + 1 glass milk' },
      { name: 'Mid-Morning', description: '1 orange + roasted peanuts (20g)' },
      { name: 'Lunch', description: 'Masoor dal + jeera rice (1 cup) + tomato salad' },
      { name: 'Snack', description: 'Buttermilk + murmura (1 cup)' },
      { name: 'Dinner', description: 'Palak paneer (small portion) + 2 rotis' }
    ],
    [
      { name: 'Breakfast', description: '2 Idlis + sambar (1 cup) + coconut chutney' },
      { name: 'Mid-Morning', description: 'Seasonal fruit chaat' },
      { name: 'Lunch', description: 'Vegetable pulao (1.5 cups) + curd (small bowl)' },
      { name: 'Snack', description: 'Roasted peanuts (30g)' },
      { name: 'Dinner', description: 'Lauki sabzi + 2 rotis + dal' }
    ],
    [
      { name: 'Breakfast', description: 'Dalia (broken wheat) porridge with jaggery and milk' },
      { name: 'Mid-Morning', description: 'Watermelon / papaya slice' },
      { name: 'Lunch', description: 'Veg thali: dal + sabzi + 2 rotis + salad (minimal oil)' },
      { name: 'Snack', description: 'Roasted makhana + coconut water' },
      { name: 'Dinner', description: 'Light vegetable soup + 1 roti + curd' }
    ]
  ],

  Veg_Indian_Premium: [
    [
      { name: 'Breakfast', description: 'Paneer paratha (2) with low-fat curd and mint chutney' },
      { name: 'Mid-Morning', description: 'Protein smoothie: 1 scoop whey + milk + banana' },
      { name: 'Lunch', description: 'Quinoa khichdi + palak paneer (150g) + salad' },
      { name: 'Snack', description: 'Mixed nuts (almonds, walnuts, cashews 40g)' },
      { name: 'Dinner', description: 'Tofu tikka (150g) + brown rice (1 cup) + raita' }
    ],
    [
      { name: 'Breakfast', description: 'Greek yogurt parfait: yogurt + granola + mixed berries' },
      { name: 'Mid-Morning', description: 'Handful cashews + 1 banana' },
      { name: 'Lunch', description: 'Brown rice + dal makhani (protein-rich) + grilled veggies' },
      { name: 'Snack', description: 'Protein bar or peanut butter toast' },
      { name: 'Dinner', description: 'Soya chunk curry (200g) + 2 multigrain rotis' }
    ],
    [
      { name: 'Breakfast', description: 'Moong dal chilla (3) + avocado / paneer filling + chutney' },
      { name: 'Mid-Morning', description: 'Fruit bowl with chia seeds + honey' },
      { name: 'Lunch', description: 'Quinoa + rajma + grilled paneer (100g) + salad' },
      { name: 'Snack', description: 'Roasted makhana + green tea' },
      { name: 'Dinner', description: 'Mushroom-spinach stir fry + 2 rotis + dal' }
    ],
    [
      { name: 'Breakfast', description: 'Oats overnight jar: oats + milk + chia + almonds + fruit' },
      { name: 'Mid-Morning', description: 'Banana + peanut butter (2 tbsp)' },
      { name: 'Lunch', description: 'Paneer bhurji (200g) + brown rice + vegetable soup' },
      { name: 'Snack', description: 'Whey protein shake + apple' },
      { name: 'Dinner', description: 'Palak soup + stuffed capsicum (paneer/soya) + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Multigrain dosa + sambar + curd' },
      { name: 'Mid-Morning', description: 'Dry fruits mix (30g) + coconut water' },
      { name: 'Lunch', description: 'Chickpea salad bowl + grilled cottage cheese + quinoa' },
      { name: 'Snack', description: 'Protein smoothie (milk + banana + cocoa powder)' },
      { name: 'Dinner', description: 'Tofu + vegetable stir fry + brown rice + dal' }
    ],
    [
      { name: 'Breakfast', description: 'Egg-free high protein scramble: paneer + veggies + spices' },
      { name: 'Mid-Morning', description: 'Apple + almond butter' },
      { name: 'Lunch', description: 'Multigrain roti (3) + chole + grilled salad' },
      { name: 'Snack', description: 'Cottage cheese with pepper + flax seeds' },
      { name: 'Dinner', description: 'Daal tadka + quinoa + roasted broccoli' }
    ],
    [
      { name: 'Breakfast', description: 'Methi thepla (2) + curd + pickle' },
      { name: 'Mid-Morning', description: 'Nuts + seeds mix + herbal tea' },
      { name: 'Lunch', description: 'Veg biryani (brown rice) + raita + salad' },
      { name: 'Snack', description: 'Roasted chickpeas (40g)' },
      { name: 'Dinner', description: 'Paneer tikka (150g) + vegetables + multigrain roti' }
    ]
  ],

  Veg_International_Budget: [
    [
      { name: 'Breakfast', description: 'Peanut butter toast (2 slices) + 1 glass milk' },
      { name: 'Mid-Morning', description: '1 banana + handful peanuts' },
      { name: 'Lunch', description: 'Pasta with tomato-vegetable sauce (olive oil, no cream)' },
      { name: 'Snack', description: 'Low-fat yogurt + 1 fruit' },
      { name: 'Dinner', description: 'Stir-fried tofu (100g) + mixed vegetables + rice' }
    ],
    [
      { name: 'Breakfast', description: 'Oatmeal (1 cup) with sliced banana and honey' },
      { name: 'Mid-Morning', description: 'Apple slices + 10 almonds' },
      { name: 'Lunch', description: 'Bean and vegetable wrap (whole wheat tortilla)' },
      { name: 'Snack', description: 'Hummus (store-bought) + carrot sticks' },
      { name: 'Dinner', description: 'Lentil soup + 1 slice bread + garden salad' }
    ],
    [
      { name: 'Breakfast', description: 'Scrambled tofu (150g) + whole wheat toast' },
      { name: 'Mid-Morning', description: '1 orange + roasted seeds mix' },
      { name: 'Lunch', description: 'Chickpea salad sandwich + side salad' },
      { name: 'Snack', description: 'Low-fat cottage cheese + cucumber slices' },
      { name: 'Dinner', description: 'Vegetable stir fry + fried rice (minimal oil)' }
    ],
    [
      { name: 'Breakfast', description: 'Whole grain cereal + milk + 1 banana' },
      { name: 'Mid-Morning', description: 'Mixed nuts (20g) + 1 fruit' },
      { name: 'Lunch', description: 'Lentil pasta with garlic and olive oil' },
      { name: 'Snack', description: 'Greek-style yogurt + 1 tbsp honey' },
      { name: 'Dinner', description: 'Bean chili + steamed broccoli + rice' }
    ],
    [
      { name: 'Breakfast', description: 'French toast (2 slices) with fruit salad' },
      { name: 'Mid-Morning', description: '1 pear + peanuts (20g)' },
      { name: 'Lunch', description: 'Minestrone soup + whole grain roll' },
      { name: 'Snack', description: 'Celery + peanut butter' },
      { name: 'Dinner', description: 'Black bean tacos in corn tortillas + salsa' }
    ],
    [
      { name: 'Breakfast', description: 'Pancakes (made from oats+banana) + syrup' },
      { name: 'Mid-Morning', description: 'Fruit smoothie (banana + milk)' },
      { name: 'Lunch', description: 'Vegetarian burrito bowl: rice + beans + salsa + corn' },
      { name: 'Snack', description: 'Cottage cheese (100g) + fruits' },
      { name: 'Dinner', description: 'Tofu fried rice with vegetables (soy sauce)' }
    ],
    [
      { name: 'Breakfast', description: 'Muesli (50g) + low-fat milk + berries' },
      { name: 'Mid-Morning', description: '1 banana + peanut butter toast' },
      { name: 'Lunch', description: 'Veggie sub sandwich (whole grain) + side salad' },
      { name: 'Snack', description: 'Low-fat yogurt (150g)' },
      { name: 'Dinner', description: 'Pasta primavera (seasonal vegetables) + parmesan' }
    ]
  ],

  Veg_International_Premium: [
    [
      { name: 'Breakfast', description: 'Avocado toast on sourdough + poached eggs (veg alt: smoked tofu)' },
      { name: 'Mid-Morning', description: 'Plant-based protein shake + handful mixed berries' },
      { name: 'Lunch', description: 'Tofu Buddha bowl: quinoa + roasted veggies + tahini dressing' },
      { name: 'Snack', description: 'Almond butter + apple slices' },
      { name: 'Dinner', description: 'Mushroom risotto (arborio rice) + roasted asparagus' }
    ],
    [
      { name: 'Breakfast', description: 'Acai bowl with granola, banana, chia seeds, coconut flakes' },
      { name: 'Mid-Morning', description: 'Celery + almond butter + protein bar' },
      { name: 'Lunch', description: 'Grilled halloumi salad with roasted peppers and quinoa' },
      { name: 'Snack', description: 'Edamame (150g) + green tea' },
      { name: 'Dinner', description: 'Black bean enchiladas + avocado crema + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Smoked tofu scramble with spinach + whole grain toast' },
      { name: 'Mid-Morning', description: 'Green smoothie: kale + banana + almond milk' },
      { name: 'Lunch', description: 'Falafel wrap with hummus, tabbouleh, and tzatziki (veg)' },
      { name: 'Snack', description: 'Mixed nuts and dried cranberries (40g)' },
      { name: 'Dinner', description: 'Lentil dal with coconut milk + basmati rice + naan' }
    ],
    [
      { name: 'Breakfast', description: 'Overnight oats: oats + almond milk + berries + hemp seeds' },
      { name: 'Mid-Morning', description: 'Protein smoothie with pea protein + banana' },
      { name: 'Lunch', description: 'Caprese salad + quinoa tabbouleh + stuffed peppers' },
      { name: 'Snack', description: 'Artisan cheese + whole grain crackers' },
      { name: 'Dinner', description: 'Truffle mushroom pasta (whole wheat) + side salad' }
    ],
    [
      { name: 'Breakfast', description: 'Greek yogurt (full fat) + walnuts + honey + granola' },
      { name: 'Mid-Morning', description: 'Matcha latte + energy bites (oat+nut)' },
      { name: 'Lunch', description: 'Mediterranean bowl: hummus + falafel + quinoa + feta' },
      { name: 'Snack', description: 'Coconut yogurt + chia pudding' },
      { name: 'Dinner', description: 'Stuffed portobello mushrooms with cheese + roasted veggies' }
    ],
    [
      { name: 'Breakfast', description: 'Smoothie bowl: pitaya + banana + granola + chia + coconut' },
      { name: 'Mid-Morning', description: 'Cashew milk latte + walnuts' },
      { name: 'Lunch', description: 'Pesto zucchini noodles + cherry tomatoes + pine nuts' },
      { name: 'Snack', description: 'Dark chocolate (70%) + almonds' },
      { name: 'Dinner', description: 'Eggplant parmesan + fresh salad + garlic bread' }
    ],
    [
      { name: 'Breakfast', description: 'Shakshuka with feta cheese + sourdough toast' },
      { name: 'Mid-Morning', description: 'Protein bar + herbal tea' },
      { name: 'Lunch', description: 'Cauliflower steak + chimichurri + brown rice' },
      { name: 'Snack', description: 'Guacamole + veggie sticks' },
      { name: 'Dinner', description: 'Jackfruit tacos + mango salsa + black beans' }
    ]
  ],

  NonVeg_Indian_Budget: [
    [
      { name: 'Breakfast', description: '3 boiled eggs + 2 whole wheat toasts + tea' },
      { name: 'Mid-Morning', description: '1 banana + roasted chana (30g)' },
      { name: 'Lunch', description: 'Egg curry (2 eggs) + steamed rice (1 cup) + salad' },
      { name: 'Snack', description: 'Buttermilk + 1 fruit' },
      { name: 'Dinner', description: 'Chicken curry (150g, home style) + 2 rotis + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Masala omelette (3 eggs) + 2 bread slices' },
      { name: 'Mid-Morning', description: 'Coconut water + peanuts (25g)' },
      { name: 'Lunch', description: 'Chicken pulao (150g chicken) + raita + onion salad' },
      { name: 'Snack', description: 'Roasted chana + chai' },
      { name: 'Dinner', description: 'Dal tadka + 2 rotis + small salad' }
    ],
    [
      { name: 'Breakfast', description: 'Boiled eggs (3) + poha (1 cup)' },
      { name: 'Mid-Morning', description: 'Seasonal fruit (apple/banana)' },
      { name: 'Lunch', description: 'Fish curry (150g) + steamed rice + vegetable sabzi' },
      { name: 'Snack', description: 'Buttermilk + roasted peanuts' },
      { name: 'Dinner', description: 'Egg bhurji (3 eggs) + 2 rotis + cucumber salad' }
    ],
    [
      { name: 'Breakfast', description: 'Egg sandwich (2 eggs) + 1 glass milk' },
      { name: 'Mid-Morning', description: 'Banana + handful peanuts' },
      { name: 'Lunch', description: 'Mutton kheema (100g) + rice + dal + salad' },
      { name: 'Snack', description: 'Roasted chana + fruit' },
      { name: 'Dinner', description: 'Chicken stew (150g) + 2 rotis + raita' }
    ],
    [
      { name: 'Breakfast', description: 'Boiled eggs (2) + upma (1 cup)' },
      { name: 'Mid-Morning', description: '1 orange + murmura chivda' },
      { name: 'Lunch', description: 'Chicken biryani (150g chicken) + raita' },
      { name: 'Snack', description: 'Tea + 2 biscuits + banana' },
      { name: 'Dinner', description: 'Egg masala (2 eggs) + 2 rotis + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Egg paratha (1 egg stuffed) + curd' },
      { name: 'Mid-Morning', description: 'Seasonal fruit + chai' },
      { name: 'Lunch', description: 'Fish fry (150g) + dal + rice + salad' },
      { name: 'Snack', description: 'Roasted peanuts + coconut water' },
      { name: 'Dinner', description: 'Chicken keema (100g) + 2 rotis + onion salad' }
    ],
    [
      { name: 'Breakfast', description: 'Besan omelette (chickpea flour + egg) + toast' },
      { name: 'Mid-Morning', description: '1 guava / papaya slice' },
      { name: 'Lunch', description: 'Chicken dal (combined) + rice + salad' },
      { name: 'Snack', description: 'Buttermilk + snack biscuits' },
      { name: 'Dinner', description: 'Boiled egg (2) + vegetable sabzi + 2 rotis' }
    ]
  ],

  NonVeg_Indian_Premium: [
    [
      { name: 'Breakfast', description: 'Egg white omelette (5 whites) + oats + black coffee' },
      { name: 'Mid-Morning', description: 'Whey protein shake + 1 banana' },
      { name: 'Lunch', description: 'Grilled chicken breast (200g) + brown rice + dal' },
      { name: 'Snack', description: 'Mixed nuts (40g) + green tea' },
      { name: 'Dinner', description: 'Chicken tikka (200g) + grilled veggies + multigrain roti' }
    ],
    [
      { name: 'Breakfast', description: 'Boiled eggs (3) + oats porridge + nuts' },
      { name: 'Mid-Morning', description: 'Greek yogurt + handful berries' },
      { name: 'Lunch', description: 'Tandoori chicken (200g) + quinoa + mint raita' },
      { name: 'Snack', description: 'Protein bar + almond milk' },
      { name: 'Dinner', description: 'Fish tikka (200g, rohu/surmai) + salad + roti' }
    ],
    [
      { name: 'Breakfast', description: 'Masala egg bhurji (3 eggs) + multigrain toast' },
      { name: 'Mid-Morning', description: 'Smoothie: milk + banana + peanut butter + whey' },
      { name: 'Lunch', description: 'Mutton stew (150g) + brown rice + salad' },
      { name: 'Snack', description: 'Cottage cheese (100g) + fruits' },
      { name: 'Dinner', description: 'Grilled prawns (150g) + garlic naan + dal' }
    ],
    [
      { name: 'Breakfast', description: 'Oats + boiled eggs (2) + black coffee' },
      { name: 'Mid-Morning', description: 'Mixed nuts + fruit' },
      { name: 'Lunch', description: 'Chicken keema (150g) + multigrain roti + raita + salad' },
      { name: 'Snack', description: 'Whey shake + peanut butter toast' },
      { name: 'Dinner', description: 'Baked fish (200g) + sweet potato + steamed veggies' }
    ],
    [
      { name: 'Breakfast', description: 'Egg white pancakes (4) + honey + black coffee' },
      { name: 'Mid-Morning', description: 'Protein shake + 1 banana' },
      { name: 'Lunch', description: 'Chicken biryani (premium: 250g chicken) + raita' },
      { name: 'Snack', description: 'Almonds + green tea + fruit' },
      { name: 'Dinner', description: 'Grilled chicken (200g) + dal + salad + roti' }
    ],
    [
      { name: 'Breakfast', description: 'Egg dosa (2) + sambar + coconut chutney' },
      { name: 'Mid-Morning', description: 'Coconut water + mixed nuts' },
      { name: 'Lunch', description: 'Salmon / pomfret curry (200g) + brown rice' },
      { name: 'Snack', description: 'Low-fat cheese + whole grain crackers' },
      { name: 'Dinner', description: 'Chicken soup + multigrain roti + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Boiled eggs (3) + banana + whey shake' },
      { name: 'Mid-Morning', description: 'Nuts + seeds mix (40g)' },
      { name: 'Lunch', description: 'Grilled chicken (200g) + quinoa + grilled capsicum' },
      { name: 'Snack', description: 'Protein bar + green tea' },
      { name: 'Dinner', description: 'Mutton seekh kebab (150g) + salad + raita + roti' }
    ]
  ],

  NonVeg_International_Budget: [
    [
      { name: 'Breakfast', description: 'Scrambled eggs (3) + 2 whole wheat toasts + orange juice' },
      { name: 'Mid-Morning', description: '1 banana + peanuts (25g)' },
      { name: 'Lunch', description: 'Grilled chicken sandwich (150g) + side salad' },
      { name: 'Snack', description: 'Low-fat yogurt + 1 fruit' },
      { name: 'Dinner', description: 'Baked chicken thigh (150g) + boiled potatoes + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Boiled eggs (2) + oatmeal (1 cup) with honey' },
      { name: 'Mid-Morning', description: 'Apple + peanut butter (1 tbsp)' },
      { name: 'Lunch', description: 'Tuna sandwich (canned) + side salad' },
      { name: 'Snack', description: 'Cottage cheese (100g) + cucumber' },
      { name: 'Dinner', description: 'Chicken stir fry (150g) + brown rice + veggies' }
    ],
    [
      { name: 'Breakfast', description: 'French omelette (3 eggs) + whole grain toast' },
      { name: 'Mid-Morning', description: 'Mixed nuts (25g) + 1 orange' },
      { name: 'Lunch', description: 'Chicken noodle soup + salad roll' },
      { name: 'Snack', description: 'Boiled egg + fruit' },
      { name: 'Dinner', description: 'Fish fillet (150g, pan-fried) + roasted sweet potato + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Egg fried rice (2 eggs) + glass of milk' },
      { name: 'Mid-Morning', description: 'Banana + peanuts' },
      { name: 'Lunch', description: 'Ground beef wrap (100g) + lettuce + salsa' },
      { name: 'Snack', description: 'Yogurt + granola (small portion)' },
      { name: 'Dinner', description: 'Chicken and vegetable pasta (olive oil based)' }
    ],
    [
      { name: 'Breakfast', description: 'Boiled eggs (2) + peanut butter toast + tea' },
      { name: 'Mid-Morning', description: '1 pear + nuts (20g)' },
      { name: 'Lunch', description: 'Chicken burrito bowl: rice + beans + chicken (100g) + salsa' },
      { name: 'Snack', description: 'Hard-boiled egg + fruit' },
      { name: 'Dinner', description: 'Baked fish (150g) + steamed broccoli + rice' }
    ],
    [
      { name: 'Breakfast', description: 'Egg muffins (3, baked with veggies) + toast' },
      { name: 'Mid-Morning', description: 'Banana smoothie (milk + banana)' },
      { name: 'Lunch', description: 'Chicken Caesar salad (no-cream dressing) + roll' },
      { name: 'Snack', description: 'Cottage cheese + tomato slices' },
      { name: 'Dinner', description: 'Shrimp stir fry (150g) + fried rice (minimal oil)' }
    ],
    [
      { name: 'Breakfast', description: 'Pancakes (2) + scrambled eggs (2) + orange juice' },
      { name: 'Mid-Morning', description: 'Apple + peanut butter' },
      { name: 'Lunch', description: 'Turkey/chicken sandwich + vegetable soup' },
      { name: 'Snack', description: 'Yogurt + mixed berries' },
      { name: 'Dinner', description: 'Ground chicken tacos + salad + corn tortillas' }
    ]
  ],

  NonVeg_International_Premium: [
    [
      { name: 'Breakfast', description: 'Smoked salmon eggs benedict on sourdough' },
      { name: 'Mid-Morning', description: 'Whey protein shake + mixed berries' },
      { name: 'Lunch', description: 'Grilled salmon fillet (200g) + quinoa + asparagus' },
      { name: 'Snack', description: 'Artisanal beef jerky (30g) + almonds' },
      { name: 'Dinner', description: 'Sirloin steak (180g) + roasted sweet potato + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Egg white omelette (5 whites) with spinach + avocado toast' },
      { name: 'Mid-Morning', description: 'Greek yogurt (full fat) + granola + walnuts' },
      { name: 'Lunch', description: 'Chicken breast (220g) + brown rice + grilled zucchini' },
      { name: 'Snack', description: 'Protein bar + herbal tea' },
      { name: 'Dinner', description: 'Pan-seared tuna steak (200g) + roasted vegetables' }
    ],
    [
      { name: 'Breakfast', description: 'Turkey bacon + scrambled eggs (3) + sourdough toast' },
      { name: 'Mid-Morning', description: 'Smoothie: banana + almond milk + protein powder' },
      { name: 'Lunch', description: 'Chicken Caesar wrap (whole grain) + mushroom soup' },
      { name: 'Snack', description: 'Cottage cheese (150g) + pineapple + flax seeds' },
      { name: 'Dinner', description: 'Lamb chops (180g) + couscous + grilled pepper salad' }
    ],
    [
      { name: 'Breakfast', description: 'Smoked turkey + cheese omelette + hash browns' },
      { name: 'Mid-Morning', description: 'Whey shake + banana + almond butter' },
      { name: 'Lunch', description: 'Grilled chicken (220g) + sweet potato mash + steamed broccoli' },
      { name: 'Snack', description: 'Mixed nuts + dark chocolate (70%)' },
      { name: 'Dinner', description: 'Baked cod (200g) + lemon butter + roasted potatoes + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Shakshuka (3 eggs) + feta + sourdough' },
      { name: 'Mid-Morning', description: 'Protein smoothie bowl with berries' },
      { name: 'Lunch', description: 'Shrimp and avocado salad bowl + quinoa' },
      { name: 'Snack', description: 'Smoked salmon + cream cheese + crackers' },
      { name: 'Dinner', description: 'Chicken marsala (200g) + wilted spinach + brown rice' }
    ],
    [
      { name: 'Breakfast', description: 'Protein waffles + Greek yogurt + berries + maple syrup' },
      { name: 'Mid-Morning', description: 'Cold brew coffee + energy bites' },
      { name: 'Lunch', description: 'Teriyaki salmon (200g) + edamame + brown rice' },
      { name: 'Snack', description: 'Beef jerky (30g) + walnuts' },
      { name: 'Dinner', description: 'Duck breast / chicken with orange glaze + roasted veggies' }
    ],
    [
      { name: 'Breakfast', description: 'Overnight protein oats + boiled eggs (2) + black coffee' },
      { name: 'Mid-Morning', description: 'Acai + protein powder smoothie' },
      { name: 'Lunch', description: 'Tuna nicoise salad (full portion) + baguette' },
      { name: 'Snack', description: 'Prosciutto + melon slices' },
      { name: 'Dinner', description: 'Filet mignon (150g) + truffle butter + asparagus + wine jus' }
    ]
  ],

  Vegan_Indian_Budget: [
    [
      { name: 'Breakfast', description: 'Poha with peanuts and vegetables (no ghee, no milk)' },
      { name: 'Mid-Morning', description: 'Banana + roasted chana (30g)' },
      { name: 'Lunch', description: 'Moong dal + rice + salad (no curd, no ghee)' },
      { name: 'Snack', description: 'Coconut water + roasted makhana' },
      { name: 'Dinner', description: 'Mixed veg sabzi (no paneer) + 2 rotis (no butter)' }
    ],
    [
      { name: 'Breakfast', description: 'Oats cooked in water with jaggery and banana' },
      { name: 'Mid-Morning', description: 'Seasonal fruit + peanuts (25g)' },
      { name: 'Lunch', description: 'Rajma + rice (no curd) + salad' },
      { name: 'Snack', description: 'Sattu drink (water-based) with lemon' },
      { name: 'Dinner', description: 'Soya chunk sabzi + 2 rotis (plant-based oil)' }
    ],
    [
      { name: 'Breakfast', description: 'Upma (plant oil, no ghee) + coconut chutney' },
      { name: 'Mid-Morning', description: 'Coconut water + banana' },
      { name: 'Lunch', description: 'Chole (no cream) + 2 rotis + onion salad' },
      { name: 'Snack', description: 'Roasted peanuts (30g) + tea (plant milk)' },
      { name: 'Dinner', description: 'Masoor dal + rice + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Besan chilla (no eggs, water batter) + green chutney' },
      { name: 'Mid-Morning', description: 'Mixed fruit bowl' },
      { name: 'Lunch', description: 'Dal + soya chunks (mixed) + rice' },
      { name: 'Snack', description: 'Murmura chivda + coconut water' },
      { name: 'Dinner', description: 'Baingan bharta + 2 rotis + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Brown bread sandwich with veg and peanut butter' },
      { name: 'Mid-Morning', description: '1 guava + roasted chana' },
      { name: 'Lunch', description: 'Vegetable biryani (plant oil) + onion salad' },
      { name: 'Snack', description: 'Coconut water + fruit' },
      { name: 'Dinner', description: 'Tofu sabzi (if available) + 2 rotis + salad' }
    ],
    [
      { name: 'Breakfast', description: 'Idli (2) + sambar (vegan, no dairy) + chutney' },
      { name: 'Mid-Morning', description: 'Seasonal fruit + peanuts' },
      { name: 'Lunch', description: 'Peas pulao + dal + salad' },
      { name: 'Snack', description: 'Roasted seeds mix (pumpkin/sunflower)' },
      { name: 'Dinner', description: 'Lauki / tori sabzi + dal + rotis' }
    ],
    [
      { name: 'Breakfast', description: 'Dalia (water-cooked) with jaggery + peanuts' },
      { name: 'Mid-Morning', description: 'Papaya / watermelon' },
      { name: 'Lunch', description: 'Veg thali (dal + sabzi + 2 rotis, all plant-based oil)' },
      { name: 'Snack', description: 'Sattu drink + banana' },
      { name: 'Dinner', description: 'Light veg soup + 1 roti + soya chunks' }
    ]
  ],

  Vegan_International_Budget: [
    [
      { name: 'Breakfast', description: 'Peanut butter toast (2 slices) + oat milk' },
      { name: 'Mid-Morning', description: 'Banana + peanuts' },
      { name: 'Lunch', description: 'Lentil soup + whole grain bread roll' },
      { name: 'Snack', description: 'Hummus + carrot/celery sticks' },
      { name: 'Dinner', description: 'Tofu stir fry (150g) + rice noodles + soy sauce' }
    ],
    [
      { name: 'Breakfast', description: 'Oatmeal with almond milk + banana + chia seeds' },
      { name: 'Mid-Morning', description: 'Mixed nuts (25g) + 1 orange' },
      { name: 'Lunch', description: 'Bean and veggie wrap (corn tortilla)' },
      { name: 'Snack', description: 'Rice cakes + peanut butter' },
      { name: 'Dinner', description: 'Black bean chili + steamed rice' }
    ],
    [
      { name: 'Breakfast', description: 'Smoothie: banana + oat milk + peanut butter' },
      { name: 'Mid-Morning', description: 'Apple + sunflower seeds (20g)' },
      { name: 'Lunch', description: 'Chickpea salad sandwich (mashed chickpea mayo)' },
      { name: 'Snack', description: 'Soy yogurt + fruit' },
      { name: 'Dinner', description: 'Veggie pasta (olive oil + garlic + veggies)' }
    ],
    [
      { name: 'Breakfast', description: 'Avocado toast + hemp seeds' },
      { name: 'Mid-Morning', description: 'Banana + oat-based protein bar' },
      { name: 'Lunch', description: 'Lentil pasta + marinara sauce + salad' },
      { name: 'Snack', description: 'Peanut butter + celery' },
      { name: 'Dinner', description: 'Tofu scramble (150g) + toast + roasted veggies' }
    ],
    [
      { name: 'Breakfast', description: 'Muesli (50g) + soy/almond milk + berries' },
      { name: 'Mid-Morning', description: 'Fruit smoothie (no dairy)' },
      { name: 'Lunch', description: 'Kidney bean rice bowl + salsa + corn' },
      { name: 'Snack', description: 'Edamame (100g)' },
      { name: 'Dinner', description: 'Vegan stir fry: tofu + bok choy + brown rice' }
    ],
    [
      { name: 'Breakfast', description: 'Banana oat pancakes + maple syrup' },
      { name: 'Mid-Morning', description: 'Handful mixed nuts' },
      { name: 'Lunch', description: 'Minestrone soup + whole grain bread' },
      { name: 'Snack', description: 'Soy yogurt + granola' },
      { name: 'Dinner', description: 'Spiced lentil dahl + basmati rice' }
    ],
    [
      { name: 'Breakfast', description: 'Overnight oats: oats + almond milk + banana + seeds' },
      { name: 'Mid-Morning', description: 'Pear + peanut butter' },
      { name: 'Lunch', description: 'Chickpea curry + brown rice' },
      { name: 'Snack', description: 'Rice cakes + avocado mash' },
      { name: 'Dinner', description: 'Vegan tacos: black beans + corn + salsa + lettuce' }
    ]
  ],

  Vegan_Premium: [
    [
      { name: 'Breakfast', description: 'Acai smoothie bowl + granola + chia + mixed berries' },
      { name: 'Mid-Morning', description: 'Pea protein shake + almond milk' },
      { name: 'Lunch', description: 'Quinoa Buddha bowl: roasted veggies + chickpeas + tahini' },
      { name: 'Snack', description: 'Mixed nuts (40g) + matcha latte (oat milk)' },
      { name: 'Dinner', description: 'Tofu tikka (200g) + coconut dal + brown rice' }
    ],
    [
      { name: 'Breakfast', description: 'Overnight oats + coconut milk + berries + hemp seeds' },
      { name: 'Mid-Morning', description: 'Green smoothie: kale + banana + almond milk' },
      { name: 'Lunch', description: 'Tempeh stir fry (150g) + edamame + soba noodles' },
      { name: 'Snack', description: 'Cashew cheese + whole grain crackers' },
      { name: 'Dinner', description: "Lentil shepherd's pie + salad" }
    ],
    [
      { name: 'Breakfast', description: 'Avocado toast + smoked tofu + cherry tomatoes' },
      { name: 'Mid-Morning', description: 'Protein bar (vegan) + coconut water' },
      { name: 'Lunch', description: 'Falafel bowl + hummus + quinoa tabbouleh' },
      { name: 'Snack', description: 'Dark chocolate (85%) + almonds' },
      { name: 'Dinner', description: 'Jackfruit curry + basmati rice + roasted cauliflower' }
    ],
    [
      { name: 'Breakfast', description: 'Smoothie bowl: mango + passion fruit + granola + seeds' },
      { name: 'Mid-Morning', description: 'Energy bites (oat + nut butter + dates)' },
      { name: 'Lunch', description: 'Seitan (wheat protein) steak + roasted potatoes + salad' },
      { name: 'Snack', description: 'Edamame (150g) + green tea' },
      { name: 'Dinner', description: 'Stuffed bell peppers: quinoa + black beans + veggies' }
    ],
    [
      { name: 'Breakfast', description: 'Tofu scramble (200g) + sourdough toast + avocado' },
      { name: 'Mid-Morning', description: 'Pea protein + berries shake' },
      { name: 'Lunch', description: 'Vegan grain bowl: farro + roasted beets + tahini + walnuts' },
      { name: 'Snack', description: 'Cashew milk latte + energy bar' },
      { name: 'Dinner', description: 'Mushroom and lentil bolognese + whole wheat pasta' }
    ],
    [
      { name: 'Breakfast', description: 'Chia pudding (coconut milk) + mango + granola' },
      { name: 'Mid-Morning', description: 'Banana + almond butter + hemp seeds' },
      { name: 'Lunch', description: 'Chickpea shawarma wrap + tahini + tabbouleh' },
      { name: 'Snack', description: 'Roasted chickpeas (40g) + herbal tea' },
      { name: 'Dinner', description: 'Thai peanut noodles (rice noodles + tofu + veggies)' }
    ],
    [
      { name: 'Breakfast', description: 'Buckwheat pancakes + agave + mixed berries' },
      { name: 'Mid-Morning', description: 'Matcha + oat milk + vegan protein ball' },
      { name: 'Lunch', description: 'Teriyaki tofu (200g) + brown rice + edamame' },
      { name: 'Snack', description: 'Guacamole + veggie sticks' },
      { name: 'Dinner', description: 'Vegan biryani (soya + nuts) + coconut raita' }
    ]
  ]
};

// ─── Key Resolver ─────────────────────────────────────────────────────────────

function resolvePlan(dietType, cuisine, budget) {
  const type = (dietType || 'Non-Veg').trim();
  const cui  = (cuisine  || 'International').trim();
  const bud  = (budget   === 'Premium') ? 'Premium' : 'Budget';

  if (type === 'Vegan' && bud === 'Premium') return PLANS.Vegan_Premium;
  if (type === 'Vegan') {
    return cui === 'Indian' ? PLANS.Vegan_Indian_Budget : PLANS.Vegan_International_Budget;
  }
  if (type === 'Veg') {
    if (cui === 'Indian' && bud === 'Budget')  return PLANS.Veg_Indian_Budget;
    if (cui === 'Indian' && bud === 'Premium') return PLANS.Veg_Indian_Premium;
    if (cui !== 'Indian' && bud === 'Budget')  return PLANS.Veg_International_Budget;
    return PLANS.Veg_International_Premium;
  }
  // Non-Veg (default)
  if (cui === 'Indian' && bud === 'Budget')  return PLANS.NonVeg_Indian_Budget;
  if (cui === 'Indian' && bud === 'Premium') return PLANS.NonVeg_Indian_Premium;
  if (cui !== 'Indian' && bud === 'Budget')  return PLANS.NonVeg_International_Budget;
  return PLANS.NonVeg_International_Premium;
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export const generateDietPlan = (profile, goal, preferences) => {
  // Drizzle returns camelCase; also support snake_case as fallback
  const weight      = profile.currentWeight      || profile.current_weight      || 70;
  const height      = profile.height             || 170;
  const age         = profile.age                || 25;
  const gender      = profile.gender             || 'Male';
  const daysPerWeek = preferences.daysPerWeek    || preferences.days_per_week   || 4;
  const primaryGoal = goal.primaryGoal           || goal.primary_goal           || 'Athletic Physique';
  const dietType    = preferences.dietType       || preferences.diet_type       || 'Non-Veg';
  const cuisine     = preferences.cuisine        || 'International';
  const budget      = preferences.budget         || 'Budget';

  const bmr  = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, daysPerWeek);

  let targetCalories = tdee;
  if (['Weight Gain', 'Bodybuilding'].includes(primaryGoal)) targetCalories += 400;
  else if (['Cutting', 'Fat Loss'].includes(primaryGoal))    targetCalories -= 400;
  targetCalories = Math.round(targetCalories);

  const proteinGrams = Math.round(weight * 2.2);
  const fatGrams     = Math.round(weight * 0.9);
  const proteinCals  = proteinGrams * 4;
  const fatCals      = fatGrams * 9;
  const carbGrams    = Math.max(0, Math.round((targetCalories - proteinCals - fatCals) / 4));

  const selectedPlan = resolvePlan(dietType, cuisine, budget);

  const getDistribution = (mealCount) => {
    if (mealCount === 5) return [0.25, 0.10, 0.30, 0.10, 0.25];
    if (mealCount === 4) return [0.25, 0.35, 0.10, 0.30];
    return Array(mealCount).fill(1 / mealCount);
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const weeklySchedule = daysOfWeek.map((day, dayIndex) => {
    const planDay = selectedPlan[dayIndex % selectedPlan.length];
    const dist    = getDistribution(planDay.length);

    const meals = planDay.map((meal, i) => ({
      name:        meal.name,
      description: meal.description,
      calories:    Math.round(targetCalories * dist[i]),
      protein:     Math.round(proteinGrams   * dist[i]),
      carbs:       Math.round(carbGrams      * dist[i]),
      fats:        Math.round(fatGrams       * dist[i]),
    }));

    return { day, meals };
  });

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const meals = weeklySchedule[todayIndex].meals;

  return {
    dailyCalories: targetCalories,
    macros:  { protein: proteinGrams, carbs: carbGrams, fats: fatGrams },
    waterIntake: 3.5,
    weeklySchedule,
    meals,
    budgetLevel: budget,
  };
};
