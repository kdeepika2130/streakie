import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// User avatar marker
const createAvatarIcon = (name = "U", status = "pending") => {
    const color =
        status === 'completed' ? '#10B981' :
            status === 'missed' ? '#EF4444' :
                '#8B5CF6';

    return L.divIcon({
        className: 'custom-avatar-marker',
        html: `<div style="
      background-color: ${color};
      width: 40px; height: 40px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; border: 3px solid white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-family: sans-serif;
    " title="${name}">
      ${name.charAt(0).toUpperCase()}
    </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

// Circle marker
const createCircleIcon = (name) => {
    return L.divIcon({
        className: 'circle-marker',
        html: `<div style="
      background-color: #8B5CF6;
      width: 40px; height: 40px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; border: 3px solid white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-family: sans-serif;
    " title="${name}">
      C
    </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

// MapUpdater to animate map center
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 13, { animate: true });
    }, [center, map]);
    return null;
};

const HabitMap = () => {
    const [users, setUsers] = useState([]);
    const [circles, setCircles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchHabit, setSearchHabit] = useState('');
    const [radius, setRadius] = useState(10);
    const [myLocation, setMyLocation] = useState(null);

    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    let currentUserId = null;
    if (token) {
        try {
            const decoded = jwtDecode(token);
            currentUserId = decoded.id; // user ID from token
        } catch (e) {
            console.error("Invalid token");
        }
    }

    // Get user location on mount
    useEffect(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setMyLocation([lat, lng]);

                try {
                    // Update backend with user location
                    await axios.put(
                        `${API_URL}/api/map/location`,
                        { lat, lng },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    await fetchNearbyUsers(lat, lng, searchHabit, radius);
                    await fetchNearbyCircles(lat, lng, radius);
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to fetch nearby data");
                }
            },
            () => {
                toast.error("Could not get location");
                setLoading(false);
            }
        );
    }, []);

    // Fetch nearby users
    const fetchNearbyUsers = async (lat, lng, habitFilter, searchRadius) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/map/nearby-users`, {
                params: { lat, lng, radius: searchRadius, habit: habitFilter },
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data.users || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    // Fetch nearby circles (include private)
    const fetchNearbyCircles = async (lat, lng, searchRadius) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/circles`, {
                params: { lat, lng, radius: searchRadius },
                headers: { Authorization: `Bearer ${token}` }, // must include token for private circles
            });

            // Filter only circles with valid coordinates
            const validCircles = (res.data.circles || []).filter(
                c => c.location?.coordinates && Array.isArray(c.location.coordinates) && c.location.coordinates.length === 2
            );
            setCircles(validCircles);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch circles");
        } finally {
            setLoading(false);
        }
    };

    // Handle search submit
    const handleSearch = (e) => {
        e.preventDefault();
        if (!myLocation) return toast.error("Location not available");

        fetchNearbyUsers(myLocation[0], myLocation[1], searchHabit, radius);
        fetchNearbyCircles(myLocation[0], myLocation[1], radius);
    };

    // Join a circle
    const handleJoinCircle = async (circleId) => {
        try {
            const res = await axios.post(
                `${API_URL}/api/circles/${circleId}/join`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.message);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to join circle");
        }
    };

    // Exit a circle
    const handleExitCircle = async (circleId) => {
        try {
            const res = await axios.post(
                `${API_URL}/api/circles/${circleId}/exit`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.message);
            setCircles(circles.filter(c => c._id !== circleId)); // Optimistic UI update
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to exit circle");
        }
    };

    // Delete a circle
    const handleDeleteCircle = async (circleId) => {
        if (!window.confirm("Are you sure you want to delete this circle? Actions cannot be undone.")) return;
        try {
            const res = await axios.delete(
                `${API_URL}/api/circles/${circleId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.message);
            setCircles(circles.filter(c => c._id !== circleId)); // Optimistic UI update
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete circle");
        }
    };

    // Filter users with valid coordinates
    const validUsers = users.filter(u =>
        u?.location?.coordinates && Array.isArray(u.location.coordinates) && u.location.coordinates.length === 2
    );

    return (
        <div className="pt-24 pb-8 px-4 max-w-7xl mx-auto min-h-screen">
            <motion.div
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <MapPin size={32} />
                        Habit Map
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Discover nearby users and circles
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search habit"
                        value={searchHabit}
                        onChange={(e) => setSearchHabit(e.target.value)}
                        className="px-4 py-2 border rounded-xl"
                    />
                    <select
                        value={radius}
                        onChange={(e) => {
                            const newRadius = Number(e.target.value);
                            setRadius(newRadius);
                            if (myLocation) {
                                fetchNearbyUsers(myLocation[0], myLocation[1], searchHabit, newRadius);
                                fetchNearbyCircles(myLocation[0], myLocation[1], newRadius);
                            }
                        }}
                        className="px-3 py-2 border rounded-xl"
                    >
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                        <option value={25}>25 km</option>
                        <option value={50}>50 km</option>
                    </select>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-xl">
                        <Navigation size={18} />
                    </button>
                </form>
            </motion.div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[600px] bg-neutral-100">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {myLocation && (
                    <MapContainer center={myLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapUpdater center={myLocation} />

                        {/* My Marker */}
                        <Marker position={myLocation} icon={createAvatarIcon("Me", "pending")}>
                            <Popup>You are here</Popup>
                        </Marker>

                        {/* Nearby Users */}
                        {validUsers.map(u => {
                            const hasCompleted = u?.habits?.some(h => h?.status === 'completed');
                            const status = hasCompleted ? 'completed' : 'pending';
                            return (
                                <Marker
                                    key={u._id}
                                    position={[u.location.coordinates[1], u.location.coordinates[0]]}
                                    icon={createAvatarIcon(u.name || "U", status)}
                                >
                                    <Popup>
                                        <div>
                                            <h3 className="font-bold">{u.name}</h3>
                                            {u?.habits?.map(h => (
                                                <div key={h._id}>{h.emoji} {h.name} 🔥{h.streak}</div>
                                            ))}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* Circles */}
                        {circles.map(c => {
                            const isAdmin = c.admins?.includes(currentUserId);
                            const isMember = c.members?.includes(currentUserId);

                            return (
                                <Marker
                                    key={c._id}
                                    position={[
                                        c.location.coordinates[1],
                                        c.location.coordinates[0]
                                    ]}
                                    icon={createCircleIcon(c.name)}
                                >
                                    <Popup>
                                        <div>
                                            <h3 className="font-bold">{c.name}</h3>
                                            <p className="text-sm">{c.description}</p>

                                            <div className="flex gap-2 mt-2">
                                                {isAdmin ? (
                                                    <button
                                                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                                                        onClick={() => handleDeleteCircle(c._id)}
                                                    >
                                                        Delete Circle
                                                    </button>
                                                ) : isMember ? (
                                                    <button
                                                        className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm"
                                                        onClick={() => handleExitCircle(c._id)}
                                                    >
                                                        Exit Circle
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm"
                                                        onClick={() => handleJoinCircle(c._id)}
                                                    >
                                                        Join Circle
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                    </MapContainer>
                )}
            </div>
        </div>
    );
};

export default HabitMap;