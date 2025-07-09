import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import DialogueService from "../services/dialogueService";

const DialogueConverter = () => {
  const [inputText, setInputText] = useState("");
  const [convertedJson, setConvertedJson] = useState(null);
  const [sceneNumber, setSceneNumber] = useState("01");
  const [sequenceNumber, setSequenceNumber] = useState("01");
  const [dialogueTitle, setDialogueTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // New state for batch processing
  const [batchDialogues, setBatchDialogues] = useState([]);
  const [showBatchMode, setShowBatchMode] = useState(false);

  const convertDialogueToJson = useCallback((text, scene, sequence, title) => {
    return DialogueService.createBatchDialogueData(
      text,
      scene,
      sequence,
      title
    );
  }, []);

  const handleConvert = () => {
    if (!inputText.trim()) {
      alert("Please enter dialogue text");
      return;
    }

    setIsProcessing(true);
    try {
      const jsonResult = convertDialogueToJson(
        inputText,
        sceneNumber,
        sequenceNumber,
        dialogueTitle
      );
      setConvertedJson(jsonResult);
    } catch (error) {
      console.error("Conversion error:", error);
      alert("Error converting dialogue. Please check the format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToBatch = () => {
    if (!inputText.trim()) {
      alert("Please enter dialogue text");
      return;
    }

    const jsonResult = convertDialogueToJson(
      inputText,
      sceneNumber,
      sequenceNumber,
      dialogueTitle
    );

    setBatchDialogues((prev) => [
      ...prev,
      {
        ...jsonResult,
        id: Date.now() + Math.random(),
        inputText: inputText, // Keep original text for editing
      },
    ]);

    // Clear form for next entry
    setInputText("");
    setDialogueTitle("");
    setSequenceNumber((prev) => String(parseInt(prev) + 1).padStart(2, "0"));
  };

  const handleRemoveFromBatch = (id) => {
    setBatchDialogues((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExportBatch = () => {
    if (batchDialogues.length === 0) {
      alert("No dialogues in batch to export");
      return;
    }

    const zip = new JSZip();
    const fileStructure =
      DialogueService.generateZipFileStructure(batchDialogues);

    Object.entries(fileStructure).forEach(([filePath, data]) => {
      zip.file(filePath, JSON.stringify(data, null, 2));
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "Dialogues.zip");
    });
  };

  const handleExport = () => {
    if (!convertedJson) return;

    const jsonString = JSON.stringify(convertedJson, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dialogue_${sceneNumber}_${sequenceNumber}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputText(e.target.result);
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/json": [".json"],
    },
    multiple: false,
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Mode Toggle */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setShowBatchMode(false)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              !showBatchMode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Single Dialogue
          </button>
          <button
            onClick={() => setShowBatchMode(true)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              showBatchMode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Batch Processing
          </button>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {showBatchMode ? "Batch Dialogue Converter" : "Dialogue Converter"}
        </h2>

        {/* Metadata Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scene Number
            </label>
            <input
              type="number"
              min="1"
              value={sceneNumber}
              onChange={(e) => setSceneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sequence Number
            </label>
            <input
              type="number"
              min="1"
              value={sequenceNumber}
              onChange={(e) => setSequenceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dialogue Title
            </label>
            <input
              type="text"
              value={dialogueTitle}
              onChange={(e) => setDialogueTitle(e.target.value)}
              placeholder="Enter dialogue title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-gray-600">
              {isDragActive
                ? "Drop the file here"
                : "Drag & drop a text file, or click to select"}
            </p>
            <p className="text-sm text-gray-500">
              Supports .txt and .json files
            </p>
          </div>
        </div>

        {/* Text Input */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dialogue Text
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your dialogue text here...&#10;&#10;Example:&#10;Watson: You're unusually still tonight, Holmes.&#10;Holmes: Because I have a puzzle before me."
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-4">
          {!showBatchMode ? (
            <button
              onClick={handleConvert}
              disabled={isProcessing || !inputText.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "Converting..." : "Convert to JSON"}
            </button>
          ) : (
            <>
              <button
                onClick={handleAddToBatch}
                disabled={!inputText.trim()}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add to Batch
              </button>
              <button
                onClick={handleExportBatch}
                disabled={batchDialogues.length === 0}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Export All as ZIP ({batchDialogues.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Batch Dialogues List */}
      {showBatchMode && batchDialogues.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Batch Dialogues ({batchDialogues.length})
          </h3>
          <div className="space-y-3">
            {batchDialogues.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {item.metadata.scene} - {item.metadata.sequence}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.metadata.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.dialogues.length} dialogues
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromBatch(item.id)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JSON Preview (Single Mode) */}
      {!showBatchMode && convertedJson && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Generated JSON
            </h3>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Export JSON
            </button>
          </div>
          <div className="bg-gray-50 rounded-md p-4 overflow-x-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(convertedJson, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DialogueConverter;
