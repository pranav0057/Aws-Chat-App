import { useEffect, useRef, useState } from "react";

const SOCKET_URL = "wss://0zgnjnkdpl.execute-api.ap-south-1.amazonaws.com/Prod";
const UPLOAD_API = "https://99oyhzbk9f.execute-api.ap-south-1.amazonaws.com/Prod/getUploadUrl";

// Mock MessageList component
function MessageList({ messages, currentUser }) {
  return (
    <div className="w-full max-w-2xl bg-white rounded shadow p-4 mb-4 h-96 overflow-y-auto">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`mb-3 ${
            msg.sender === "System"
              ? "text-center text-gray-500 text-sm"
              : msg.sender === currentUser
              ? "text-right"
              : "text-left"
          }`}
        >
          {msg.sender !== "System" && (
            <div className="font-semibold text-sm text-gray-700">{msg.sender}</div>
          )}
          <div
            className={`inline-block p-2 rounded ${
              msg.sender === "System"
                ? "bg-gray-200"
                : msg.sender === currentUser
                ? "bg-blue-500 text-white"
                : "bg-gray-300"
            }`}
          >
            {msg.type === "image" ? (
              <div>
                <img src={msg.fileUrl} alt={msg.fileName} className="max-w-xs rounded" />
                {msg.message && <p className="mt-2">{msg.message}</p>}
              </div>
            ) : (
              msg.message
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}

// Mock ImagePreview component
function ImagePreview({ file, onRemove }) {
  return (
    <div className="w-full max-w-2xl bg-white rounded shadow p-4 mb-4 relative">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
      >
        ×
      </button>
      <img src={file.preview} alt="Preview" className="max-w-xs rounded" />
      <p className="text-sm text-gray-600 mt-2">{file.name}</p>
    </div>
  );
}

export default function Chat() {
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [text, setText] = useState("");
  const [imageData, setImageData] = useState(null);
  const [status, setStatus] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);

  // Load from session storage on mount
  useEffect(() => {
    const savedUsername = sessionStorage.getItem("chat_username");
    const savedMessages = sessionStorage.getItem("chat_messages");
    
    if (savedUsername) {
      setUsername(savedUsername);
    }
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to session storage
  useEffect(() => {
    if (username && messages.length > 0) {
      sessionStorage.setItem("chat_messages", JSON.stringify(messages));
    }
  }, [messages, username]);

  // WebSocket connection
  useEffect(() => {
    if (!username) return;

    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      addSystem(`Connected as ${username} to global chat.`);
    };

    socket.onclose = () => {
      setIsConnected(false);
      addSystem("Disconnected.");
    };

    socket.onerror = () => {
      setIsConnected(false);
      addSystem("WebSocket error.");
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      } catch {
        addSystem(event.data);
      }
    };

    return () => {
      socket.close();
    };
  }, [username]);

  function addSystem(text) {
    setMessages((prev) => [...prev, { sender: "System", message: text, timestamp: Date.now() }]);
  }

  function handleLogin() {
    const nameToSet = inputValue.trim();
    if (!nameToSet) return;

    sessionStorage.setItem("chat_username", nameToSet);
    setUsername(nameToSet);
    setInputValue("");
  }

  function handleLogout() {
    sessionStorage.removeItem("chat_username");
    sessionStorage.removeItem("chat_messages");
    setUsername("");
    setMessages([]);
    setIsConnected(false);
  }

  async function uploadFile(file) {
    if (!file) return;
    
    try {
      setStatus("Uploading...");
      const res = await fetch(UPLOAD_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      const data = await res.json();
      const upload = await fetch(data.uploadUrl, { method: "PUT", body: file });
      if (!upload.ok) throw new Error("Upload failed");

      const preview = URL.createObjectURL(file);
      setImageData({ fileUrl: data.fileUrl, name: file.name, type: file.type, preview });
      setStatus("Image ready. Press Send.");
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  function sendMessage() {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      addSystem("Socket not connected.");
      return;
    }

    const payload = {
      action: "sendmessage",
      sender: username,
      timestamp: Date.now(),
    };

    if (imageData) {
      payload.type = "image";
      payload.fileUrl = imageData.fileUrl;
      payload.fileName = imageData.name;
      payload.fileType = imageData.type;
      payload.message = text || null;
      setImageData(null);
      setStatus("");
    } else {
      if (!text.trim()) return;
      payload.type = "text";
      payload.message = text;
    }

    socketRef.current.send(JSON.stringify(payload));
    setText("");
  }

  // Login screen
  if (!username) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Join Global Chat</h2>
          <input
            className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blue-500"
            placeholder="Enter your name..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
          >
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <div className="w-full flex justify-between items-center max-w-2xl mb-4">
        <div>
          <h2 className="text-2xl font-semibold">WebSocket Chat</h2>
          <p className="text-sm text-gray-600">
            Chatting as <strong>{username}</strong> • 
            <span className={isConnected ? "text-green-600" : "text-red-600"}>
              {isConnected ? " Connected" : " Disconnected"}
            </span>
          </p>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
          🚪 Leave Chat
        </button>
      </div>

      <MessageList messages={messages} currentUser={username} />

      {imageData && <ImagePreview file={imageData} onRemove={() => setImageData(null)} />}

      <div className="w-full max-w-2xl flex gap-3 mt-4">
        <input
          className="flex-1 p-2 border border-gray-300 rounded disabled:bg-gray-100"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={!isConnected}
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!isConnected}
        >
          Send
        </button>

        <label className={`px-4 py-2 rounded cursor-pointer flex items-center text-white ${
          isConnected ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
        }`}>
          📷 Image
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => uploadFile(e.target.files[0])}
            disabled={!isConnected}
          />
        </label>
      </div>

      {status && (
        <div className="w-full max-w-2xl mt-3 p-2 bg-yellow-100 border border-yellow-400 rounded text-sm">
          {status}
        </div>
      )}
    </div>
  );
}