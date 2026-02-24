import { useEffect, useState } from "react";
import { Users, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import api from "../utils/api"; // import api, not HabitCircles

function CircleChat() {
  const { id: circleId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [membersVisible, setMembersVisible] = useState(false);
  const [members, setMembers] = useState([]);

  // Load messages and members
  useEffect(() => {
    loadMessages();
    loadMembers();
    const interval = setInterval(loadMessages, 3000); // auto refresh every 3s
    return () => clearInterval(interval);
  }, [circleId]);

  const loadMessages = async () => {
    try {
      const msgs = await api.getCircleMessages(circleId);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessages([]);
    }
  };

  const loadMembers = async () => {
    try {
      const circle = await api.getCircles({}); // get all circles
      const current = circle.find((c) => c._id === circleId);
      setMembers(current?.membersList || []); // ensure backend returns membersList
    } catch (err) {
      console.error("Failed to load members:", err);
      setMembers([]);
    }
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    try {
      const msg = await api.sendMessage(circleId, { text: newMsg });
      setMessages((prev) => [...prev, msg]);
      setNewMsg("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.deleteMessage(circleId, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen relative">
      {/* Header */}
      <div className="p-4 bg-primary-600 text-white flex justify-between items-center">
        <h2 className="text-lg font-semibold">Circle Chat</h2>
        <button onClick={() => setMembersVisible(!membersVisible)}>
          <Users size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
        {messages.map((msg) => (
          <div
            key={msg._id || msg.id}
            className="bg-white p-3 rounded-lg shadow flex justify-between items-start"
          >
            <div>
              <p className="font-medium text-sm">{msg.sender?.name || "User"}</p>
              <p className="text-sm text-neutral-700">{msg.text}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {new Date(msg.createdAt || msg.timestamp).toLocaleString()}
              </p>
            </div>
            {msg.sender?._id === localStorage.getItem("userId") && (
              <button
                onClick={() => deleteMessage(msg._id || msg.id)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-lg"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-primary-600 text-white px-4 rounded-lg"
        >
          Send
        </button>
      </div>

      {/* Members Sidebar */}
      {membersVisible && (
        <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg p-4">
          <h3 className="font-semibold mb-2">Members</h3>
          {members.length ? (
            <ul>
              {members.map((m) => (
                <li key={m._id || m.id}>{m.name}</li>
              ))}
            </ul>
          ) : (
            <p>No members yet</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CircleChat;
