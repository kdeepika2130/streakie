import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';

const StreakBarGraph = ({ habits }) => {
    if (!habits || habits.length === 0) return null;

    const getLast7Days = () => {
        const dates = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            dates.push(subDays(today, i));
        }
        return dates;
    };

    const processWeeklyData = () => {
        const days = getLast7Days();
        return days.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            let completions = 0;
            habits.forEach(habit => {
                if (habit.completedDates && habit.completedDates.includes(dateStr)) {
                    completions++;
                }
            });
            return {
                name: format(date, 'EEE'),
                completions
            };
        });
    };

    const data = processWeeklyData();

    return (
        <motion.div
            className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3 className="text-lg font-display font-bold text-neutral-900 mb-4">Weekly Completions</h3>
            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="completions" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default StreakBarGraph;
