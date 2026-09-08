import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: any[];
}

export default function ProgressChart({ data }: Props) {
  // Format date for X Axis
  const formattedData = data.map(d => ({
    ...d,
    dateStr: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="bg-white p-4 rounded shadow-md h-80">
      <h3 className="font-bold text-gray-700 mb-4">Weight Trend (kg)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dateStr" />
          <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip />
          <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
