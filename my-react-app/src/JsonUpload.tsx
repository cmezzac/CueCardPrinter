import { useState } from "react";
import "./JsonUpload.css";
import type { CueCard } from "./types/CueCard";
import { generateFlashcards } from "./generateFlashcards"; // <-- IMPORT IT

export default function JsonUpload() {
  const [jsonData, setJsonData] = useState<CueCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/json", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a .json or .txt file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as CueCard[];
        setJsonData(parsed);
        setError(null);
      } catch {
        setError("Invalid JSON format inside the file.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="page-center">
      <div className="json-upload-container">
        <h2 className="json-upload-title">Upload JSON or TXT</h2>

        <input
          type="file"
          accept=".json, .txt"
          onChange={handleFileUpload}
          className="json-upload-input"
        />

        {error && <p className="json-error">{error}</p>}

        {jsonData && (
          <pre className="json-output">{JSON.stringify(jsonData, null, 2)}</pre>
        )}

        <button
          className="submit-btn"
          onClick={() => jsonData && generateFlashcards(jsonData)}
          disabled={!jsonData}
        >
          Generate PDF
        </button>
      </div>
    </div>
  );
}
