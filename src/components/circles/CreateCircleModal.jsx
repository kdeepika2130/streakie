import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CreateCircleModal = ({ onClose, onCircleCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Fitness',
        visibility: 'public',
        radius: 10,
    });
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    setError('Could not get location. Ensure permissions are granted.');
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ No authentication token found');
                throw new Error('Not authenticated');
            }

            console.log('✓ Form submit fired - Creating circle');

            const payload = { ...formData };
            if (location) {
                payload.latitude = location.latitude;
                payload.longitude = location.longitude;
            }

            const apiURL = `${API_URL}/api/circles`;
            console.log(`📡 POST request to: ${apiURL}`);
            console.log(`📋 Payload:`, payload);

            const res = await axios.post(apiURL, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✓ Circle created successfully:', res.data.circle);
            onCircleCreated(res.data.circle);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Error creating circle';
            console.error('❌ Circle creation failed:', {
                status: err.response?.status,
                message: errorMsg,
                url: `${API_URL}/api/circles`,
                details: err.response?.data
            });
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white rounded-xl shadow-elevated max-w-md w-full max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-display font-semibold text-neutral-900">Create New Circle</h2>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-neutral-600"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="name">Circle Name</label>
                            <input
                                id="name" name="name" type="text" value={formData.name} onChange={handleChange} required
                                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                                placeholder="e.g., Morning Routine Masters"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="description">Description</label>
                            <textarea
                                id="description" name="description" value={formData.description} onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm resize-none h-20"
                                placeholder="What is this circle about?"
                            />
                        </div>

                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="category">Category</label>
                                <select id="category" name="category" value={formData.category} onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                                >
                                    <option value="Fitness">Fitness</option>
                                    <option value="Study">Study</option>
                                    <option value="Meditation">Meditation</option>
                                    <option value="Coding">Coding</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="visibility">Visibility</label>
                                <select id="visibility" name="visibility" value={formData.visibility} onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                                >
                                    <option value="public">Public - Anyone can join</option>
                                    <option value="private">Private - Request to join</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Local Clustering (Optional)</label>
                            <div className="flex gap-2 items-center">
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    className="border border-neutral-200 text-neutral-700 px-3 py-2 rounded-lg hover:bg-neutral-100 flex items-center gap-2 text-sm flex-1"
                                >
                                    <MapPin size={16} />
                                    {location ? "Location Included" : "Include My Location"}
                                </button>
                                {location && (
                                    <div className="flex-1">
                                        <input
                                            type="number" name="radius" value={formData.radius} onChange={handleChange} placeholder="Radius (km)"
                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                                            title="Visibility radius in km"
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">Allows users nearby to discover this circle.</p>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-sm" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50" disabled={loading}>
                                {loading ? 'Validating Streak & Creating...' : 'Create Circle'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CreateCircleModal;
