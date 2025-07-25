import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import gptConverterService from "../services/gptConverterService";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const PDFDialogueConverter = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessedData(null);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      // Step 1: Upload PDF to backend to extract text
      const response = await fetch("http://localhost:3001/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract text from PDF.");
      }

      const { text } = await response.json();

      // Step 2: Send extracted text to GPT for conversion
      const gptResult = await gptConverterService.convertMultiSequenceToJSON(
        text
      );

      setProcessedData(gptResult);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleExport = () => {
    if (!processedData || !processedData.sequences) {
      alert("No data to export.");
      return;
    }

    const zip = new JSZip();
    const sceneName = "SCENE_01"; // Default or derive from data
    const sceneFolder = zip.folder(sceneName);

    Object.entries(processedData.sequences).forEach(
      ([sequenceName, sequenceData]) => {
        const sequenceFolder = sceneFolder.folder(sequenceName);
        sequenceFolder.file(
          "dialogue.json",
          JSON.stringify(sequenceData, null, 2)
        );
      }
    );

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, `${sceneName}.zip`);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        PDF to Dialogue Converter
      </h2>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          {isDragActive
            ? "Drop the PDF here..."
            : "Drag & drop a PDF file, or click to select"}
        </p>
      </div>

      {isProcessing && (
        <div className="mt-6 text-center">
          <p className="text-blue-600">Processing PDF, please wait...</p>
        </div>
      )}

      {error && (
        <div className="mt-6 text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      )}

      {processedData && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Conversion Result
          </h3>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Export as ZIP
          </button>
          <div className="bg-gray-50 rounded-md p-4 mt-4 overflow-x-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(processedData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFDialogueConverter;
