import React, { useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { format } from 'date-fns';

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

const chartTypes = [
  { label: 'Bar Graph', value: 'bar' },
  { label: 'Line Graph', value: 'line' },
  { label: 'Pie Chart', value: 'pie' },
];

function HabitGraph({ habits }) {
  const [activeChart, setActiveChart] = useState('dailyCompletions'); // 'dailyCompletions', 'streakTrend', 'statusDistribution'

  // Get last 30 days
  const getLast30Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(format(date, 'MMM dd'));
    }
    return dates;
  };

  const last30DaysLabels = getLast30Days();

  // Process daily completions over last 30 days
  const dailyCompletionsData = habits.reduce((acc, habit) => {
    if (!habit.completedDates) return acc;
    habit.completedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const dayIndex = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex <= 29) {
        acc[dayIndex] = (acc[dayIndex] || 0) + 1;
      }
    });
    return acc;
  }, {});

  const dailyCompletions = last30DaysLabels.map((_, index) => dailyCompletionsData[index] || 0);

  const dailyCompletionsChart = {
    labels: last30DaysLabels,
    datasets: [
      {
        label: 'Daily Completions',
        data: dailyCompletions,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
      },
    ],
  };

  // Streak trend: Approximate as cumulative completions or daily streak (simplified as rolling average)
  const streakTrendData = dailyCompletions.map((completions, index) => {
    // Simple rolling streak approximation: if completions > 0, streak continues
    let streak = 0;
    for (let i = index; i < dailyCompletions.length; i++) {
      if (dailyCompletions[i] > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }).reverse(); // Reverse to show from past to present

  const streakTrendChart = {
    labels: last30DaysLabels,
    datasets: [
      {
        label: 'Streak Days',
        data: streakTrendData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Status distribution
  const statusCounts = habits.reduce((acc, habit) => {
    const status = habit.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusChart = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: 'Habits by Status',
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgb(34, 197, 94)', // completed green
          'rgb(59, 130, 246)', // pending blue
          'rgb(239, 68, 68)', // missed red
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        position: 'right',
      },
    },
    cutout: '60%',
  };

  if (habits.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-neutral-200 p-6 mt-8">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No habits data available</p>
          <p className="text-sm mt-1 text-neutral-500">Add some habits to see your progress graphs!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-neutral-200 p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-800">Habit Progress Graphs</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-neutral-600">View:</label>
          <select
            className="border border-neutral-300 rounded-lg px-3 py-1.5 bg-white text-sm font-medium"
            value={activeChart}
            onChange={e => setActiveChart(e.target.value)}
          >
            <option value="dailyCompletions">Daily Completions (Bar)</option>
            <option value="streakTrend">Streak Trend (Line)</option>
            <option value="statusDistribution">Status Distribution (Doughnut)</option>
          </select>
        </div>
      </div>

      <div className="w-full h-64">
        {activeChart === 'dailyCompletions' && <Bar data={dailyCompletionsChart} options={baseOptions} />}
        {activeChart === 'streakTrend' && <Line data={streakTrendChart} options={baseOptions} />}
        {activeChart === 'statusDistribution' && <Doughnut data={statusChart} options={doughnutOptions} />}
      </div>

      <div className="mt-4 text-xs text-neutral-500 text-center">
        Graphs update live every 30 seconds as habits are completed or updated.
      </div>
    </div>
  );
}

export default HabitGraph;
