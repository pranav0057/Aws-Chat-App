// src/components/MessageItem.js (or wherever it's defined)

export default function MessageItem({ msg, currentUser }) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // Check if the message was sent by the current user
  const isMe = msg.sender === currentUser; 

  return (
    // Style the message container based on sender
    <div className={`mb-3 p-3 rounded-md max-w-3xl ${isMe ? "bg-blue-50 ml-auto border border-blue-200" : "bg-white border border-gray-200"}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`font-bold ${isMe ? "text-blue-600" : "text-gray-800"}`}>
          {/* Display "You" for the current user, or their name otherwise */}
          {isMe ? "You" : msg.sender} 
        </span>
        <span className="text-xs text-gray-500">{time}</span>
      </div>

      {msg.type === "image" ? (
        <div>
          <img
            src={msg.fileUrl}
            alt="User upload"
            className="max-w-xs max-h-72 rounded cursor-pointer hover:opacity-80 border"
            onClick={() => window.open(msg.fileUrl, "_blank")}
          />
          {msg.message && <p className="mt-2 text-gray-800">{msg.message}</p>}
        </div>
      ) : (
        <p className="text-gray-800">{msg.message}</p>
      )}
    </div>
  );
}