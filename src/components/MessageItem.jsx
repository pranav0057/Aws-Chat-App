export default function MessageItem({ msg }) {
  const time = new Date(msg.timestamp).toLocaleTimeString();

  return (
    <div className="mb-3 p-3 bg-gray-100 rounded-md">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-gray-800">{msg.sender}</span>
        <span className="text-xs text-gray-500">{time}</span>
      </div>

      {msg.type === "image" ? (
        <div>
          <img
            src={msg.fileUrl}
            className="max-w-xs max-h-72 rounded cursor-pointer hover:opacity-80"
            onClick={() => window.open(msg.fileUrl, "_blank")}
          />
          {msg.message && <p className="mt-2">{msg.message}</p>}
        </div>
      ) : (
        <p>{msg.message}</p>
      )}
    </div>
  );
}