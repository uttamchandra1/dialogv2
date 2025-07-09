class DialogueService {
  static validateDialogueText(text) {
    const lines = text.split("\n").filter((line) => line.trim());
    const errors = [];

    if (lines.length === 0) {
      errors.push("No dialogue text provided");
      return errors;
    }

    let hasValidDialogue = false;
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine && !trimmedLine.includes(":")) {
        errors.push(`Line ${index + 1}: Missing speaker (should contain ':')`);
      } else if (
        trimmedLine.includes(":") &&
        !trimmedLine.startsWith("Dialogue")
      ) {
        hasValidDialogue = true;
        const colonIndex = trimmedLine.indexOf(":");
        const speaker = trimmedLine.substring(0, colonIndex).trim();
        const text = trimmedLine.substring(colonIndex + 1).trim();

        if (!speaker) {
          errors.push(`Line ${index + 1}: Empty speaker name`);
        }
        if (!text) {
          errors.push(`Line ${index + 1}: Empty dialogue text`);
        }
      }
    });

    if (!hasValidDialogue) {
      errors.push(
        "No valid dialogue found. Each line should contain a speaker and text separated by colon."
      );
    }

    return errors;
  }

  static generateFolderStructure(scene, sequence) {
    return {
      basePath: "Dialogues",
      scenePath: `Dialogues/SCENE_${scene.padStart(2, "0")}`,
      sequencePath: `Dialogues/SCENE_${scene.padStart(
        2,
        "0"
      )}/SEQUENCE_${sequence.padStart(2, "0")}`,
      filePath: `Dialogues/SCENE_${scene.padStart(
        2,
        "0"
      )}/SEQUENCE_${sequence.padStart(2, "0")}/dialogue.json`,
    };
  }

  static createDialogueJson(dialogues, metadata) {
    return {
      metadata: {
        ...metadata,
        version: "1.0.0",
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      dialogues: dialogues.map((dialogue) => ({
        ...dialogue,
        id: this.generateId(),
        timestamp: new Date().toISOString(),
      })),
    };
  }

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static exportToFileSystem(jsonData, fileName) {
    // This would integrate with a backend service in a real application
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // New methods for batch processing
  static convertTextToDialogues(text) {
    const lines = text.split("\n").filter((line) => line.trim());
    const dialogues = [];
    let currentSpeaker = "";
    let currentText = "";

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Check if line contains speaker (ends with colon)
      if (trimmedLine.includes(":") && !trimmedLine.startsWith("Dialogue")) {
        // Save previous dialogue if exists
        if (currentSpeaker && currentText) {
          dialogues.push({
            speaker: currentSpeaker,
            text: currentText.trim(),
            type: "dialogue",
          });
        }

        const colonIndex = trimmedLine.indexOf(":");
        currentSpeaker = trimmedLine.substring(0, colonIndex).trim();
        currentText = trimmedLine.substring(colonIndex + 1).trim();
      } else if (trimmedLine && currentSpeaker) {
        // Continue text for current speaker
        currentText += (currentText ? " " : "") + trimmedLine;
      }
    });

    // Add the last dialogue
    if (currentSpeaker && currentText) {
      dialogues.push({
        speaker: currentSpeaker,
        text: currentText.trim(),
        type: "dialogue",
      });
    }

    return dialogues;
  }

  static createBatchDialogueData(text, scene, sequence, title) {
    const dialogues = this.convertTextToDialogues(text);

    return {
      metadata: {
        scene: `SCENE_${scene.padStart(2, "0")}`,
        sequence: `SEQUENCE_${sequence.padStart(2, "0")}`,
        title: title || `Dialogue ${scene}-${sequence}`,
        timestamp: new Date().toISOString(),
        totalDialogues: dialogues.length,
      },
      dialogues: dialogues,
    };
  }

  static createExportStructure(dialogueData) {
    // Create the JSON structure matching your existing format - just the dialogues array
    return {
      dialogues: dialogueData.dialogues.map((d) => ({
        type: d.type || "dialogue",
        speaker: d.speaker,
        text: d.text,
      })),
    };
  }

  static generateZipFileStructure(batchDialogues) {
    const structure = {};

    batchDialogues.forEach((dialogue) => {
      const { metadata } = dialogue;
      const scenePath = metadata.scene;
      const sequencePath = `${scenePath}/${metadata.sequence}`;
      const filePath = `${sequencePath}/dialogue.json`;

      // Only export the clean dialogues structure, no metadata
      structure[filePath] = {
        dialogues: dialogue.dialogues.map((d) => ({
          type: d.type || "dialogue",
          speaker: d.speaker,
          text: d.text,
        })),
      };
    });

    return structure;
  }

  // Method to scan existing Dialogues folder structure
  static async scanExistingDialogues() {
    try {
      // In a real application, this would be an API call to the backend
      // For now, we'll simulate the structure based on your existing folders
      const mockStructure = [
        {
          scene: "SCENE_01",
          sequences: [
            {
              sequence: "SEQUENCE_01",
              title: "Holmes and Watson Conversation",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_02",
              title: "Client Arrival",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_03",
              title: "Investigation Begins",
              dialogueCount: 5,
            },
            {
              sequence: "SEQUENCE_04",
              title: "Evidence Collection",
              dialogueCount: 6,
            },
            { sequence: "SEQUENCE_05", title: "First Clue", dialogueCount: 4 },
            {
              sequence: "SEQUENCE_05A",
              title: "Alternative Path A",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_05B",
              title: "Alternative Path B",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_05C",
              title: "Alternative Path C",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_06",
              title: "Suspect Interview",
              dialogueCount: 7,
            },
            {
              sequence: "SEQUENCE_07",
              title: "New Evidence",
              dialogueCount: 5,
            },
            {
              sequence: "SEQUENCE_08",
              title: "Breakthrough",
              dialogueCount: 6,
            },
            {
              sequence: "SEQUENCE_08A",
              title: "Alternative Breakthrough A",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_08B",
              title: "Alternative Breakthrough B",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_08C",
              title: "Alternative Breakthrough C",
              dialogueCount: 4,
            },
            { sequence: "SEQUENCE_09", title: "Resolution", dialogueCount: 8 },
          ],
        },
        {
          scene: "SCENE_02",
          sequences: [
            {
              sequence: "SEQUENCE_01",
              title: "Station Interior",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_02",
              title: "Security Check",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_03",
              title: "Meeting Point",
              dialogueCount: 5,
            },
            {
              sequence: "SEQUENCE_04",
              title: "Information Exchange",
              dialogueCount: 6,
            },
            {
              sequence: "SEQUENCE_05",
              title: "Plan Discussion",
              dialogueCount: 7,
            },
            { sequence: "SEQUENCE_06", title: "Preparation", dialogueCount: 4 },
            {
              sequence: "SEQUENCE_06A",
              title: "Alternative Prep A",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_06B",
              title: "Alternative Prep B",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_06C",
              title: "Alternative Prep C",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_06D",
              title: "Alternative Prep D",
              dialogueCount: 3,
            },
            { sequence: "SEQUENCE_07", title: "Execution", dialogueCount: 8 },
            {
              sequence: "SEQUENCE_08",
              title: "Complications",
              dialogueCount: 6,
            },
            {
              sequence: "SEQUENCE_08A",
              title: "Alternative Complication A",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_08B",
              title: "Alternative Complication B",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_08C",
              title: "Alternative Complication C",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_08D",
              title: "Alternative Complication D",
              dialogueCount: 4,
            },
            { sequence: "SEQUENCE_09", title: "Adaptation", dialogueCount: 7 },
            { sequence: "SEQUENCE_10", title: "Success", dialogueCount: 5 },
          ],
        },
      ];

      return mockStructure;
    } catch (error) {
      console.error("Error scanning dialogues:", error);
      return [];
    }
  }

  // Method to get dialogue content for a specific scene/sequence
  static async getDialogueContent(scene, sequence) {
    try {
      // In a real application, this would fetch the actual JSON file
      // For now, we'll return a mock structure
      const mockContent = {
        dialogues: [
          {
            type: "narration",
            text: `Location: ${scene} - ${sequence}`,
          },
          {
            type: "dialogue",
            speaker: "Character A",
            text: "This is a sample dialogue line.",
          },
          {
            type: "dialogue",
            speaker: "Character B",
            text: "This is a response from another character.",
          },
        ],
      };

      return mockContent;
    } catch (error) {
      console.error("Error getting dialogue content:", error);
      return null;
    }
  }
}

export default DialogueService;
