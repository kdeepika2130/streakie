import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';

const StreakLineGraph = ({ habits }) => {
    if (!habits || habits.length === 0) return null;

    const processTrendData = () => {
        const dates = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            dates.push(subDays(today, i));
        }

        const data = dates.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            let activeStreaksApproximation = 0;

            habits.forEach(habit => {
                if (habit.completedDates && habit.completedDates.includes(dateStr)) {
                    activeStreaksApproximation++;
                }
            });

            return {
                date: format(date, 'MMM dd'),
                trend: activeStreaksApproximation
            };
        });

        // Simple smoothing/accumulation to simulate streak trend
        let streakAccumulator = 0;
        return data.map((point) => {
            if (point.trend > 0) streakAccumulator++;
            else streakAccumulator = Math.max(0, streakAccumulator - 1);

            return {
                ...point,
                streak: streakAccumulator
            };
        });
    };

    const data = processTrendData();

    return (
        <motion.div
            className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
        >
            <h3 className="text-lg font-display font-bold text-neutral-900 mb-4">Streak Growth (30 Days)</h3>
            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} minTickGap={20} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Line type="monotone" dataKey="streak" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default StreakLineGraph;
