// 🔧 BASE URL CONFIGURATION for localhost development
// Ensure this matches backend PORT (typically http://localhost:5000 for Vite dev setup)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = {
  request: async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
    try {
      const res = await fetch(url, config);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        if (!res.ok) throw new Error("Server error");
        return text;
      }
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      // Normalize _id for circles
      const normalizeIds = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(normalizeIds);
        } else if (obj && typeof obj === "object") {
          if (obj.id && !obj._id) obj._id = obj.id;
          for (const key in obj) {
            obj[key] = normalizeIds(obj[key]);
          }
        }
        return obj;
      };
      return normalizeIds(data);
    } catch (err) {
      console.error("API Error:", err);
      throw err;
    }
  },
  // Circle API
  getCircles: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.request(`/circles?${searchParams}`);
  },
  getMyCircles: () => api.request("/circles/my"),
  createCircle: (data) =>
    api.request("/circles", { method: "POST", body: JSON.stringify(data) }),
  joinCircle: (circleId) =>
    api.request(`/circles/${circleId}/join`, { method: "POST" }),
  sendJoinRequest: (circleId) =>
    api.request(`/circles/${circleId}/request`, { method: "POST" }),
  leaveCircle: (circleId) =>
    api.request(`/circles/${circleId}/leave`, { method: "DELETE" }),
  deleteCircle: (circleId) =>
    api.request(`/circles/${circleId}/`, { method: "DELETE" }),
  // Chat API (example stub functions)
  getCircleMessages: (circleId) =>
    api.request(`/circles/${circleId}/messages`),
  sendMessage: (circleId, message) =>
    api.request(`/circles/${circleId}/messages`, {
      method: "POST",
      body: JSON.stringify(message),
    }),
  deleteMessage: (circleId, messageId) =>
    api.request(`/circles/${circleId}/messages/${messageId}`, {
      method: "DELETE",
    }),
};

export default api;
