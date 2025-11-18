export default function ImagePreview({ file, onRemove }) {
  return (
    <div className="w-4/5 mt-3 p-3 flex items-center gap-3 bg-white border-2 border-blue-500 rounded-lg">
      <img src={file.preview} className="w-20 h-20 rounded" />
      <span>{file.name}</span>
      <button
        onClick={onRemove}
        className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
      >
        ✕ Remove
      </button>
    </div>
  );
}
