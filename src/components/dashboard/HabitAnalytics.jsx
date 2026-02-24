import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

const HabitAnalytics = ({ habits }) => {
    if (!habits || habits.length === 0) return null;

    const getAnalyticsData = () => {
        let completed = 0;
        let missed = 0;
        let pending = 0;

        habits.forEach(habit => {
            if (habit.status === 'completed') completed++;
            else if (habit.status === 'missed') missed++;
            else pending++;
        });

        return [
            { name: 'Completed', value: completed },
            { name: 'Missed', value: missed },
            { name: 'Pending', value: pending },
        ].filter(item => item.value > 0);
    };

    const data = getAnalyticsData();

    if (data.length === 0) return null;

    return (
        <motion.div
            className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200 mt-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <h3 className="text-lg font-display font-bold text-neutral-900 mb-4">Today's Overview</h3>
            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default HabitAnalytics;
