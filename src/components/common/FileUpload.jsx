import { useRef } from 'react';

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function FileUpload({ files, onChange }) {
  const inputRef = useRef(null);

  async function handleFiles(fileList) {
    const newFiles = [];
    for (const file of fileList) {
      const dataUrl = await readAsDataUrl(file);
      newFiles.push({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }
    onChange([...files, ...newFiles]);
  }

  function removeFile(id) {
    onChange(files.filter((f) => f.id !== id));
  }

  return (
    <div className="file-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
        📎 Ladda upp bild/dokument
      </button>

      {files.length > 0 && (
        <div className="file-grid">
          {files.map((f) => (
            <div key={f.id} className="file-item">
              {f.type?.startsWith('image/') ? (
                <img src={f.dataUrl} alt={f.name} className="file-thumb" />
              ) : (
                <div className="file-thumb file-thumb-doc">📄</div>
              )}
              <div className="file-name" title={f.name}>{f.name}</div>
              <button type="button" className="file-remove" onClick={() => removeFile(f.id)} aria-label={`Ta bort ${f.name}`}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
