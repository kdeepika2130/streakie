import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Shield } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CircleFeed from "./CircleFeed";
import JoinRequestsPanel from "./JoinRequestsPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CircleDetails = ({ circleId, onBack, currentUserId }) => {
    const [circle, setCircle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("feed");
    const [userLocation, setUserLocation] = useState(null);

    // ================= GET USER LOCATION SAFELY =================
    const fetchUserLocation = () => {
        if (!("geolocation" in navigator)) return; // browser doesn't support

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                console.warn("Geolocation error:", error.message);
                toast.error(
                    "Location access blocked. Nearby circle features may be limited."
                );
            }
        );
    };

    // ================= FETCH CIRCLE =================
    const fetchCircleDetails = useCallback(async () => {
        if (!circleId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("❌ No token for fetching circle");
                throw new Error("Authentication required");
            }

            const apiURL = `${API_URL}/api/circles/${circleId}`;
            console.log(`📡 GET request to: ${apiURL}`);

            const res = await axios.get(apiURL, {
                headers: { Authorization: `Bearer ${token}` },
                params: userLocation
                    ? { lat: userLocation.lat, lng: userLocation.lng }
                    : {},
            });

            console.log("✓ Circle details fetched:", res.data?.circle);
            setCircle(res.data?.circle || null);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to load circle";
            console.error("❌ Fetch circle error:", {
                status: error.response?.status,
                message: errorMsg,
                url: `${API_URL}/api/circles/${circleId}`,
                details: error.response?.data
            });
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [circleId, userLocation]);

    useEffect(() => {
        fetchUserLocation();
    }, []);

    useEffect(() => {
        fetchCircleDetails();
    }, [fetchCircleDetails]);

    // ================= DELETE CIRCLE =================
    const handleDeleteCircle = async () => {
        if (!window.confirm("Delete this circle permanently?")) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication required");

            const apiURL = `${API_URL}/api/circles/${circleId}`;
            console.log(`📡 DELETE request to: ${apiURL}`);

            const res = await axios.delete(apiURL, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("✓ Circle deleted successfully");
            toast.success(res.data?.message || "Circle deleted");
            onBack();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to delete circle";
            console.error("❌ Delete error:", {
                status: error.response?.status,
                message: errorMsg,
                url: `${API_URL}/api/circles/${circleId}`
            });
            toast.error(errorMsg);
        }
    };

    // ================= EXIT CIRCLE =================
    const handleExitCircle = async () => {
        if (!window.confirm("Are you sure you want to exit this circle?")) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication required");

            const apiURL = `${API_URL}/api/circles/${circleId}/exit`;
            console.log(`📡 POST request to: ${apiURL}`);

            const res = await axios.post(
                apiURL,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("✓ Exited circle successfully");
            toast.success(res.data?.message || "Exited circle");
            onBack();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to exit circle";
            console.error("❌ Exit error:", {
                status: error.response?.status,
                message: errorMsg,
                url: `${API_URL}/api/circles/${circleId}/exit`
            });
            toast.error(errorMsg);
        }
    };

    // ================= STATES =================
    if (loading)
        return <div className="text-center py-10">Loading circle details...</div>;

    if (!circle)
        return <div className="text-center py-10">Circle not found</div>;

    const isAdmin = circle.admins?.some((a) => a?._id === currentUserId) || false;
    const isMember =
        circle.members?.some((m) => m?._id === currentUserId) || false;

    // ================= UI =================
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
        >
            {/* BACK BUTTON */}
            <button
                onClick={onBack}
                className="flex items-center text-neutral-500 hover:text-neutral-800 mb-6 w-fit transition-colors"
            >
                <ArrowLeft size={16} className="mr-2" /> Back to Circles
            </button>

            {/* HEADER */}
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold">{circle.name}</h1>
                            {circle.visibility === "private" && (
                                <span className="px-3 py-1 bg-neutral-100 text-xs rounded-full">
                                    Private
                                </span>
                            )}
                        </div>

                        <p className="text-neutral-600 mb-3">{circle.description}</p>

                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                            <div className="flex items-center">
                                <Users size={16} className="mr-1" /> {circle.members?.length || 0} Members
                            </div>
                            <div className="flex items-center text-primary-600">
                                <Shield size={16} className="mr-1" /> Created by {circle.createdBy?.name || "Unknown"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-6 border-b mb-6">
                {["feed", "members", "settings"].map((tab) => (
                    <button
                        key={tab}
                        className={`pb-3 text-sm font-medium ${activeTab === tab ? "text-primary-600" : "text-neutral-500"
                            }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}

                {isAdmin && (
                    <button
                        className={`pb-3 text-sm font-medium ${activeTab === "requests" ? "text-primary-600" : "text-neutral-500"
                            }`}
                        onClick={() => setActiveTab("requests")}
                    >
                        Join Requests
                    </button>
                )}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-auto">
                <AnimatePresence mode="wait">
                    {activeTab === "feed" && (
                        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {isMember ? (
                                <CircleFeed circleId={circleId} currentUserId={currentUserId} />
                            ) : (
                                <div className="text-center py-10 text-neutral-500">
                                    You must be a member to see the feed.
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "members" && (
                        <motion.div
                            key="members"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {circle.members?.map((member) => {
                                const memberIsAdmin =
                                    circle.admins?.some((a) => a?._id === member?._id) || false;
                                return (
                                    <div key={member._id} className="p-4 bg-white rounded-lg shadow">
                                        <p className="font-medium flex items-center gap-2">
                                            {member.name}
                                            {memberIsAdmin && <Shield size={14} className="text-amber-500" />}
                                        </p>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                    {activeTab === "requests" && isAdmin && (
                        <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <JoinRequestsPanel circleId={circleId} onUpdate={fetchCircleDetails} />
                        </motion.div>
                    )}

                    {activeTab === "settings" && (
                        <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="bg-white p-6 rounded-lg shadow">
                                {isAdmin ? (
                                    <button onClick={handleDeleteCircle} className="px-4 py-2 bg-red-600 text-white rounded">
                                        Delete Circle
                                    </button>
                                ) : isMember ? (
                                    <button onClick={handleExitCircle} className="px-4 py-2 bg-orange-500 text-white rounded">
                                        Exit Circle
                                    </button>
                                ) : (
                                    <p>You must be a member.</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default CircleDetails;