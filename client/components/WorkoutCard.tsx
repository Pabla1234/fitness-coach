import React from 'react';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
  id?: string;
}

interface DailyWorkout {
  day: string;
  focus: string;
  exercises: Exercise[];
  isRestDay: boolean;
  id?: string;
}

interface Props {
  workout: DailyWorkout;
}

export default function WorkoutCard({ workout }: Props) {
  if (workout.isRestDay) {
    return (
      <div className="bg-gray-50 border-l-4 border-green-400 p-4 rounded shadow-sm opacity-75">
        <h3 className="font-bold text-lg text-gray-700">{workout.day}</h3>
        <p className="text-green-600 font-medium">Rest & Recovery 🌿</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-l-4 border-blue-500 p-4 rounded shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-gray-800">{workout.day}</h3>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
          {workout.focus}
        </span>
      </div>
      
      <div className="space-y-3">
        {workout.exercises.map((ex) => (
           <div key={ex.id || ex.name} className="flex justify-between items-center border-b pb-2 last:border-0">
             <div>
               <p className="font-medium text-gray-900">{ex.name}</p>
               {ex.notes && <p className="text-xs text-gray-500">{ex.notes}</p>}
             </div>
             <div className="text-right text-sm">
                <span className="block text-gray-600 font-semibold">{ex.sets} Sets</span>
                <span className="block text-gray-500">{ex.reps} Reps</span>
             </div>
           </div>
        ))}
      </div>
    </div>
  );
}
