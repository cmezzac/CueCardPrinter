import { useState } from "react";
import "./JsonUpload.css";
import type { CueCard } from "./types/CueCard";
import { generateFlashcards } from "./generateFlashcards";

export default function JsonUpload() {
  const [jsonData, setJsonData] = useState<CueCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const exampleJson = `Write me cue cards in the following format as a JSON array of objects with "question" and "answer" 
  
[
  { "question": "X?", "answer": "..." },
  { "question": "Y?", "answer": "..." }
]`;

  const copyText = () => {
    navigator.clipboard.writeText(exampleJson);
  };

  const extractTextFromRTF = (rtf: string) => {
    return rtf
      .replace(/\\par[d]?/g, "\n")
      .replace(/\\'([0-9A-Fa-f]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )
      .replace(/\\[a-zA-Z]+\d*/g, "")
      .replace(/[{}]/g, "")
      .trim();
  };

  const sanitizeJSON = (text: string) => {
    return text
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u00A0/g, " ")
      .replace(/\u2013|\u2014/g, "-")
      .replace(/\t/g, " ")
      .replace(/\r/g, "")
      .trim();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);
    setIsComplete(false);
    setJsonData(null);

    const allowedTypes = [
      "application/json",
      "text/plain",
      "application/rtf",
      "text/rtf",
    ];

    const isRTF = file.name.toLowerCase().endsWith(".rtf");

    if (!allowedTypes.includes(file.type) && !isRTF) {
      setIsLoading(false);
      setError("Please upload a .json, .txt, or .rtf file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        let text = event.target?.result as string;

        if (isRTF) {
          text = extractTextFromRTF(text);
        }

        text = sanitizeJSON(text);

        const parsed = JSON.parse(text) as CueCard[];
        setJsonData(parsed);

        // 🔥 Fake 3-second loading animation
        setTimeout(() => {
          setIsLoading(false);
          setIsComplete(true);
        }, 3000);
      } catch (err) {
        setIsLoading(false);
        setError(
          "Invalid JSON format. Ensure your file contains ONLY valid JSON using straight quotes."
        );
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="page-center">
      <div className="json-upload-container">

        {/* Instruction Box */}
        <div className="instruction-box">
          <div className="instruction-header">
            <span>Attach this prompt to your AI chat</span>
            <button className="copy-btn" onClick={copyText}>
              📋
            </button>
          </div>

          <pre className="instruction-content">{exampleJson}</pre>

          <p className="instruction-footer">
            1. Paste your cue card material into ChatGPT.<br />
            2. Attach the prompt.<br />
            3. Copy the AI's answer into a .txt file.<br />
            4 <strong>Mac users:</strong> You may need to change the file extension to <code>.json</code>, then repaste the content and save again.<br />
            5. Upload the file below.
          </p>

        </div>

        <h2 className="json-upload-title">Upload JSON / TXT</h2>

        <input
          type="file"
          accept=".json,.txt,.rtf"
          className="json-upload-input"
          onChange={handleFileUpload}
        />

        {error && <p className="json-error">{error}</p>}

        {/* 🔥 Fake loading bar */}
        {isLoading && (
          <div className="loading-bar-wrapper">
            <div className="loading-bar"></div>
            <p>Processing your file...</p>
          </div>
        )}

        {/* 🔥 Success message */}
        {isComplete && (
          <p className="success-message">
            Your cue cards are ready!
          </p>
        )}

        {/* 🔥 Generate Button */}
        <button
          className="submit-btn"
          onClick={() => jsonData && generateFlashcards(jsonData)}
          disabled={!jsonData || !isComplete}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
