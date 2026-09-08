import React from 'react';

interface Meal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  id?: string;
}

interface DietPlan {
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  waterIntake: number;
  meals: Meal[];
}

interface Props {
  plan: DietPlan;
}

export default function DietCard({ plan }: Props) {
  return (
    <div className="bg-white rounded shadow-md p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🥗 Nutrition Plan</h2>
      
      {/* Macros Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
        <div className="p-3 bg-blue-50 rounded">
           <span className="block text-xl font-bold text-blue-700">{plan.dailyCalories}</span>
           <span className="text-xs text-blue-500 font-semibold">CALORIES</span>
        </div>
        <div className="p-3 bg-red-50 rounded">
           <span className="block text-xl font-bold text-red-700">{plan.macros.protein}g</span>
           <span className="text-xs text-red-500 font-semibold">PROTEIN</span>
        </div>
        <div className="p-3 bg-yellow-50 rounded">
           <span className="block text-xl font-bold text-yellow-700">{plan.macros.carbs}g</span>
           <span className="text-xs text-yellow-500 font-semibold">CARBS</span>
        </div>
        <div className="p-3 bg-orange-50 rounded">
           <span className="block text-xl font-bold text-orange-700">{plan.macros.fats}g</span>
           <span className="text-xs text-orange-500 font-semibold">FATS</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-gray-700">Daily Meals</h3>
        {plan.meals.map((meal, idx) => (
          <div key={idx} className="flex flex-col md:flex-row md:justify-between md:items-center border-b pb-3 last:border-0">
             <div className="mb-2 md:mb-0">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide block">{meal.name}</span>
                <span className="font-medium text-gray-800">{meal.description}</span>
             </div>
             <div className="text-sm text-gray-600 flex gap-3">
               <span>🔥 {meal.calories} kcal</span>
               <span>P: {meal.protein}g</span>
               <span>C: {meal.carbs}g</span>
               <span>F: {meal.fats}g</span>
             </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t flex justify-between items-center text-blue-600 bg-blue-50 p-3 rounded">
         <span className="font-semibold">💧 Water Target</span>
         <span className="font-bold text-lg">{plan.waterIntake} Liters / day</span>
      </div>
    </div>
  );
}
