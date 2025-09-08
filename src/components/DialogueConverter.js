import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import DialogueService from "../services/dialogueService";
import gptConverterService from "../services/gptConverterService";

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
  const [validationErrors, setValidationErrors] = useState([]);
  const [isValid, setIsValid] = useState(false);

  // State for batch preview and editing
  const [expandedBatchItems, setExpandedBatchItems] = useState(new Set());
  const [editingItem, setEditingItem] = useState(null);
  const [editedItems, setEditedItems] = useState(new Set());

  // New GPT conversion function
  const convertTextToJSON = useCallback(
    async (text, scene, sequence, title) => {
      try {
        const currentScene = `SCENE_${scene.padStart(2, "0")}`;
        const currentSequence = `SEQUENCE_${sequence}`;
        const jsonResult = await gptConverterService.convertToJSON(
          text,
          currentScene,
          currentSequence
        );

        return {
          metadata: {
            scene: `SCENE_${scene.padStart(2, "0")}`,
            sequence: `SEQUENCE_${sequence}`, // Use sequence as-is, don't pad
            title: title || `Dialogue ${scene}-${sequence}`,
            timestamp: new Date().toISOString(),
          },
          ...jsonResult, // Spread the entire result, including the 'dialogues' wrapper
        };
      } catch (error) {
        console.error("GPT conversion error:", error);
        throw new Error(
          "Failed to convert text using GPT. Please check your input format."
        );
      }
    },
    []
  );

  const validateInput = () => {
    if (!inputText.trim()) {
      setValidationErrors(["Please enter dialogue text"]);
      setIsValid(false);
      return false;
    }

    // Basic validation - check if text has some content
    if (inputText.trim().length < 10) {
      setValidationErrors([
        "Text seems too short. Please provide more content.",
      ]);
      setIsValid(false);
      return false;
    }

    setValidationErrors([]);
    setIsValid(true);
    return true;
  };

  // Validate on input change
  React.useEffect(() => {
    if (inputText.trim()) {
      validateInput();
    } else {
      setValidationErrors([]);
      setIsValid(false);
    }
  }, [inputText]);

  const handleConvert = async () => {
    if (!validateInput()) {
      return;
    }

    setIsProcessing(true);
    try {
      const jsonResult = await convertTextToJSON(
        inputText,
        sceneNumber,
        sequenceNumber,
        dialogueTitle
      );
      setConvertedJson(jsonResult);
    } catch (error) {
      console.error("Conversion error:", error);
      alert(
        error.message || "Error converting dialogue. Please check the format."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Functions for batch preview and editing
  const toggleBatchItemExpansion = (itemId) => {
    const newExpanded = new Set(expandedBatchItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedBatchItems(newExpanded);
  };

  const handleEditBatchItem = (item) => {
    setEditingItem({
      ...item,
      editedText: item.inputText || "", // Use original input text for editing
      editedMetadata: { ...item.metadata },
    });
  };

  const handleSaveEditedItem = async () => {
    if (!editingItem) return;

    try {
      setIsProcessing(true);

      // Convert the edited text using GPT
      const sceneNumber = editingItem.editedMetadata.scene.replace(
        "SCENE_",
        ""
      );
      const sequenceNumber = editingItem.editedMetadata.sequence.replace(
        "SEQUENCE_",
        ""
      );

      const updatedJson = await convertTextToJSON(
        editingItem.editedText,
        sceneNumber,
        sequenceNumber,
        editingItem.editedMetadata.title
      );

      // Update the batch dialogues array
      setBatchDialogues((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...updatedJson,
                id: editingItem.id,
                inputText: editingItem.editedText,
                metadata: {
                  ...updatedJson.metadata,
                  title: editingItem.editedMetadata.title,
                },
              }
            : item
        )
      );

      // Mark this item as edited
      setEditedItems((prev) => new Set([...prev, editingItem.id]));

      // Close edit modal
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving edited item:", error);
      alert("Error saving edited item. Please check the format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleAddToBatch = async () => {
    if (!validateInput()) {
      return;
    }

    setIsProcessing(true);
    try {
      const jsonResult = await convertTextToJSON(
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
      // Don't auto-increment sequence number since user might want custom formats
      setValidationErrors([]);
    } catch (error) {
      console.error("Batch conversion error:", error);
      alert(
        error.message || "Error converting dialogue. Please check the format."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFromBatch = (id) => {
    setBatchDialogues((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExportBatch = async (includeFigma = false) => {
    if (batchDialogues.length === 0) {
      alert("No dialogues in batch to export");
      return;
    }

    console.log("Exporting batch dialogues:", batchDialogues);

    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const fileStructure = await DialogueService.generateCompleteZipStructure(
        batchDialogues,
        includeFigma
      );

      Object.entries(fileStructure).forEach(([filePath, data]) => {
        if (data !== null) {
          if (filePath.endsWith("Dialogues_with_Figma.json")) {
            // Figma files are already JSON strings
            zip.file(filePath, data);
          } else {
            // Regular JSON files need to be stringified
            zip.file(filePath, JSON.stringify(data, null, 2));
          }
        }
      });

      const content = await zip.generateAsync({ type: "blob" });
      const fileName = includeFigma
        ? "Dialogues_with_Figma.zip"
        : "Dialogues.zip";
      saveAs(content, fileName);
    } catch (error) {
      console.error("Export error:", error);
      alert("Error exporting dialogues. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportFigmaOnly = async () => {
    if (batchDialogues.length === 0) {
      alert("No dialogues in batch to export");
      return;
    }

    console.log("Exporting Figma file only:", batchDialogues);

    setIsProcessing(true);
    try {
      // Import FigmaApiService
      const { default: FigmaApiService } = await import(
        "../services/figmaApiService.js"
      );

      // Check if API is configured
      if (!FigmaApiService.isConfigured()) {
        const instructions = FigmaApiService.getConfigurationInstructions();
        alert(
          `${instructions.title}\n\n${instructions.steps.join("\n")}\n\n${
            instructions.note
          }`
        );
        return;
      }

      // Create Figma-compatible file
      const result = await FigmaApiService.createFigmaFile(
        batchDialogues,
        `Dialogue Studio - ${new Date().toLocaleDateString()}`
      );

      if (result.success) {
        // Download the Figma-compatible JSON file
        const figmaContent = JSON.stringify(result.figmaFile, null, 2);
        const blob = new Blob([figmaContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Dialogues_with_Figma.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`🎉 Figma-compatible file created successfully!

File downloaded as: "Dialogues_with_Figma.json"

Your dialogues have been organized into a Figma-compatible structure with:
- Scene-based organization
- Sequence groupings  
- Character dialogues, narration, and choice blocks
- Professional styling and layout

To use this file:
1. Import it into Figma using File > Import
2. Or use it with Figma plugins that support JSON import
3. Or use it as a reference for implementing the dialogue UI

Note: This creates a Figma-compatible JSON structure that can be imported into Figma or used with design tools.`);
      }
    } catch (error) {
      console.error("Figma export error:", error);
      alert(
        `Error creating Figma file: ${error.message}\n\nPlease check your API configuration and try again.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (!convertedJson) return;

    console.log("DialogueService:", DialogueService);
    console.log(
      "exportToFileSystem method:",
      DialogueService.exportToFileSystem
    );

    try {
      // Use the DialogueService method for consistency
      DialogueService.exportToFileSystem(
        { dialogues: convertedJson.dialogues },
        `dialogue_${sceneNumber}_${sequenceNumber}.json` // Use sequence as-is
      );
    } catch (error) {
      console.error("Export error:", error);
      // Fallback to manual export if DialogueService fails
      const jsonString = JSON.stringify(
        { dialogues: convertedJson.dialogues },
        null,
        2
      );
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dialogue_${sceneNumber}_${sequenceNumber}.json`; // Use sequence as-is
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
          {/* Sequence Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sequence Number (e.g., 01, 06A, 6.1.1)
            </label>
            <input
              type="text"
              value={sequenceNumber}
              onChange={(e) => setSequenceNumber(e.target.value)}
              placeholder="01, 06A, 6.1.1, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Format Guide */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            GPT-Powered Format Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded p-3">
              <h4 className="font-medium text-gray-800 mb-2">Narration</h4>
              <code className="text-xs bg-gray-100 p-1 rounded block">
                Any descriptive text without a speaker
              </code>
            </div>
            <div className="bg-white rounded p-3">
              <h4 className="font-medium text-gray-800 mb-2">
                Character Dialogue
              </h4>
              <code className="text-xs bg-gray-100 p-1 rounded block">
                CharacterName: "Dialogue text here"
              </code>
            </div>
            <div className="bg-white rounded p-3">
              <h4 className="font-medium text-gray-800 mb-2">Choice Block</h4>
              <code className="text-xs bg-gray-100 p-1 rounded block">
                Choice: Question text here
                <br />
                • Option 1 text
                <br />
                • Option 2 text
                <br />• Option 3 text
              </code>
            </div>
          </div>
          <div className="mt-3 text-sm text-blue-700">
            <strong>Note:</strong> GPT will intelligently parse your text and
            ignore frame numbers, section headers, and other reference labels.
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
            placeholder={`Paste your dialogue text here...

Example formats:

FRAME 6

Dialogue:
FLUX: "I can stimulate your EchoMod. Bring back suppressed grief."
ASH: "Do it."
Memories crash in: Riven leaving. Riven screaming. Ash alone in a field of neon rain.
ASH: "Riven… I wasn't ready to let you go."

OR

Holmes: "You're unusually still tonight, Watson."
Watson: "Because I have a puzzle before me."

OR

Choice: How does Watson react to the letter?
• She outplayed you.
• You admire her, don't you?
• Say nothing.

GPT will automatically detect the format and convert it appropriately.`}
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div
            className="mt-4 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Format Errors:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Message */}
        {isValid && inputText.trim() && (
          <div
            className="mt-4 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">✓ Format Valid!</strong>
            <span className="ml-2">
              Your dialogue format is ready for GPT conversion.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-4">
          {!showBatchMode ? (
            <button
              onClick={handleConvert}
              disabled={isProcessing || !inputText.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "Converting with GPT..." : "Convert to JSON"}
            </button>
          ) : (
            <>
              <button
                onClick={handleAddToBatch}
                disabled={isProcessing || !inputText.trim()}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? "Adding to Batch..." : "Add to Batch"}
              </button>
              <button
                onClick={() => handleExportBatch(false)}
                disabled={batchDialogues.length === 0 || isProcessing}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Export JSON ZIP ({batchDialogues.length})
                {editedItems.size > 0 && (
                  <span className="ml-2 bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                    with {editedItems.size} edits
                  </span>
                )}
              </button>
              <button
                onClick={handleExportFigmaOnly}
                disabled={batchDialogues.length === 0 || isProcessing}
                className="flex-1 bg-pink-600 text-white py-3 px-6 rounded-md hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Create a Figma-compatible JSON file with your dialogues organized by scenes and sequences"
              >
                Export Figma Layout ({batchDialogues.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Batch Dialogues List with Preview */}
      {showBatchMode && batchDialogues.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Batch Dialogues ({batchDialogues.length})
            </h3>
            <div className="text-sm text-gray-600">
              {editedItems.size > 0 && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {editedItems.size} edited
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {batchDialogues.map((item) => (
              <div key={item.id} className="border rounded-lg bg-gray-50">
                {/* Item Header */}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-800">
                          {item.metadata.scene} - {item.metadata.sequence}
                        </h4>
                        {editedItems.has(item.id) && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            Edited
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.metadata.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.dialogues ? item.dialogues.length : 0} dialogues
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleBatchItemExpansion(item.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {expandedBatchItems.has(item.id)
                          ? "Hide Preview"
                          : "Show Preview"}
                      </button>
                      <button
                        onClick={() => handleEditBatchItem(item)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveFromBatch(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Preview */}
                {expandedBatchItems.has(item.id) && (
                  <div className="border-t bg-white p-4">
                    <h5 className="font-medium text-gray-700 mb-3">
                      JSON Preview
                    </h5>
                    <div className="bg-gray-50 rounded-md p-4 overflow-x-auto max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify({ dialogues: item.dialogues }, null, 2)}
                      </pre>
                    </div>
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          const jsonString = JSON.stringify(
                            { dialogues: item.dialogues },
                            null,
                            2
                          );
                          const blob = new Blob([jsonString], {
                            type: "application/json",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${item.metadata.scene}_${item.metadata.sequence}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Export This JSON
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                Edit Dialogue: {editingItem.metadata.scene} -{" "}
                {editingItem.metadata.sequence}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Edit Metadata */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Metadata</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scene
                    </label>
                    <input
                      type="text"
                      value={editingItem.editedMetadata.scene}
                      onChange={(e) =>
                        setEditingItem((prev) => ({
                          ...prev,
                          editedMetadata: {
                            ...prev.editedMetadata,
                            scene: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sequence
                    </label>
                    <input
                      type="text"
                      value={editingItem.editedMetadata.sequence}
                      onChange={(e) =>
                        setEditingItem((prev) => ({
                          ...prev,
                          editedMetadata: {
                            ...prev.editedMetadata,
                            sequence: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingItem.editedMetadata.title}
                      onChange={(e) =>
                        setEditingItem((prev) => ({
                          ...prev,
                          editedMetadata: {
                            ...prev.editedMetadata,
                            title: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Text Content */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">
                  Dialogue Text
                </h4>
                <textarea
                  value={editingItem.editedText}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      editedText: e.target.value,
                    }))
                  }
                  placeholder="Enter your dialogue text here..."
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Preview Current JSON */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">
                  Current JSON Preview
                </h4>
                <div className="bg-gray-50 rounded-md p-4 overflow-x-auto max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(
                      { dialogues: editingItem.dialogues },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedItem}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Preview (Single Mode) */}
      {!showBatchMode && convertedJson && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Generated JSON (GPT-Converted)
            </h3>
            <div className="space-x-2">
              <button
                onClick={() => {
                  try {
                    // Export the raw array, not wrapped in dialogues object
                    DialogueService.exportToFileSystem(
                      convertedJson.dialogues,
                      `dialogue_${sceneNumber}_${sequenceNumber}.json`
                    );
                  } catch (error) {
                    console.error("Export error:", error);
                    // Fallback to manual export if DialogueService fails
                    const jsonString = JSON.stringify(
                      convertedJson.dialogues,
                      null,
                      2
                    );
                    const blob = new Blob([jsonString], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `dialogue_${sceneNumber}_${sequenceNumber}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Export Clean JSON
              </button>
              <button
                onClick={handleExport}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Export Full JSON
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-md p-4 overflow-x-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify({ dialogues: convertedJson.dialogues }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DialogueConverter;
