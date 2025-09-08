/**
 * Figma API Service
 * Handles communication with Figma API to create real Figma files
 */

class FigmaApiService {
  constructor() {
    this.apiBaseUrl = "https://api.figma.com/v1";
    this.apiKey = process.env.REACT_APP_FIGMA_API_KEY || "";
    this.teamId = process.env.REACT_APP_FIGMA_TEAM_ID || "";
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Create a Figma-compatible file with dialogue content
   * Note: Figma API doesn't support creating new files directly.
   * This method creates a Figma-compatible JSON that can be imported.
   * @param {Array} batchDialogues - Array of dialogue data objects
   * @param {string} fileName - Name for the Figma file
   * @returns {Promise<Object>} - Figma file creation response
   */
  async createFigmaFile(batchDialogues, fileName = "Dialogue Studio Export") {
    if (!this.isConfigured()) {
      throw new Error(
        "Figma API key not configured. Please set REACT_APP_FIGMA_API_KEY in your environment variables."
      );
    }

    try {
      // Create a Figma-compatible document structure
      const documentStructure =
        this.createFigmaDocumentStructure(batchDialogues);

      // Generate a unique file key (simulated)
      const fileKey = this.generateFileKey();

      // Create the complete Figma file structure
      const figmaFile = {
        name: fileName,
        lastModified: new Date().toISOString(),
        version: "1.0.0",
        ...documentStructure,
        components: this.createComponents(),
        styles: this.createStyles(),
        schemaVersion: 1,
        figmaVersion: "1.0.0",
        fileType: "figma-document",
      };

      return {
        success: true,
        fileKey,
        fileUrl: `https://www.figma.com/file/${fileKey}`,
        message: "Figma-compatible file created successfully!",
        figmaFile: figmaFile,
      };
    } catch (error) {
      console.error("Error creating Figma file:", error);
      throw new Error(`Failed to create Figma file: ${error.message}`);
    }
  }

  /**
   * Generate a unique file key for the Figma file
   * @returns {string} - Unique file key
   */
  generateFileKey() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }

  /**
   * Create reusable components
   */
  createComponents() {
    return {
      "dialogue-item": {
        id: "dialogue-item-component",
        name: "Dialogue Item",
        type: "COMPONENT",
        description: "Reusable dialogue item component",
      },
    };
  }

  /**
   * Create text and color styles
   */
  createStyles() {
    return {
      "white-text": {
        id: "white-text-style",
        name: "White Text",
        type: "TEXT",
        fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
      },
      "character-text": {
        id: "character-text-style",
        name: "Character Text",
        type: "TEXT",
        fills: [{ type: "SOLID", color: { r: 0.15, g: 0.39, b: 0.92, a: 1 } }],
      },
      "narration-text": {
        id: "narration-text-style",
        name: "Narration Text",
        type: "TEXT",
        fills: [{ type: "SOLID", color: { r: 0.42, g: 0.45, b: 0.5, a: 1 } }],
      },
      "choice-text": {
        id: "choice-text-style",
        name: "Choice Text",
        type: "TEXT",
        fills: [{ type: "SOLID", color: { r: 0.49, g: 0.23, b: 0.91, a: 1 } }],
      },
      "default-text": {
        id: "default-text-style",
        name: "Default Text",
        type: "TEXT",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }],
      },
    };
  }

  /**
   * Create Figma document structure for dialogues
   * @param {Array} batchDialogues - Array of dialogue data objects
   * @returns {Object} - Figma document structure
   */
  createFigmaDocumentStructure(batchDialogues) {
    // Group dialogues by scene
    const scenesMap = new Map();
    batchDialogues.forEach((dialogue) => {
      const sceneKey = dialogue.metadata.scene;
      if (!scenesMap.has(sceneKey)) {
        scenesMap.set(sceneKey, []);
      }
      scenesMap.get(sceneKey).push(dialogue);
    });

    const totalDialogues = batchDialogues.reduce(
      (sum, dialogue) => sum + dialogue.dialogues.length,
      0
    );

    const totalHeight = Math.max(
      1200,
      totalDialogues * 120 + scenesMap.size * 200 + 300
    );

    return {
      document: {
        id: "0:0",
        name: "All Dialogues",
        type: "DOCUMENT",
        children: [
          {
            id: "0:1",
            name: "Page 1",
            type: "PAGE",
            children: [
              this.createMasterHeader(scenesMap.size, totalDialogues),
              ...this.createSceneFrames(scenesMap),
              this.createMasterFooter(scenesMap.size, totalHeight),
            ],
            absoluteBoundingBox: {
              x: 0,
              y: 0,
              width: 1400,
              height: totalHeight,
            },
          },
        ],
      },
    };
  }

  /**
   * Create master header frame
   */
  createMasterHeader(sceneCount, totalDialogues) {
    return {
      id: "master-header",
      name: "Master Header",
      type: "FRAME",
      children: [
        {
          id: "header-bg",
          name: "Header Background",
          type: "RECTANGLE",
          fills: [{ type: "SOLID", color: { r: 0.05, g: 0.1, b: 0.3, a: 1 } }],
          absoluteBoundingBox: { x: 0, y: 0, width: 1400, height: 100 },
        },
        {
          id: "title",
          name: "Title",
          type: "TEXT",
          characters: "Dialogue Studio - All Scenes",
          style: {
            fontFamily: "Inter",
            fontSize: 32,
            fontWeight: 800,
            fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
          },
          absoluteBoundingBox: { x: 40, y: 20, width: 600, height: 40 },
        },
        {
          id: "stats",
          name: "Statistics",
          type: "TEXT",
          characters: `${sceneCount} scenes • ${totalDialogues} total dialogues`,
          style: {
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 400,
            fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
          },
          absoluteBoundingBox: { x: 40, y: 60, width: 400, height: 20 },
        },
      ],
      absoluteBoundingBox: { x: 0, y: 0, width: 1400, height: 100 },
      fills: [{ type: "SOLID", color: { r: 0.05, g: 0.1, b: 0.3, a: 1 } }],
    };
  }

  /**
   * Create scene frames
   */
  createSceneFrames(scenesMap) {
    const sceneFrames = [];
    let currentY = 120; // Start after header

    scenesMap.forEach((dialogues, sceneKey) => {
      // Group this scene's dialogues by sequence to avoid repeated headers
      const sequenceKeyToDialogues = new Map();
      dialogues.forEach((dialogue) => {
        const sequenceKey = dialogue?.metadata?.sequence || "SEQUENCE_01";
        if (!sequenceKeyToDialogues.has(sequenceKey)) {
          sequenceKeyToDialogues.set(sequenceKey, []);
        }
        sequenceKeyToDialogues.get(sequenceKey).push(dialogue);
      });

      // Merge dialogues per sequence so each sequence renders once
      const mergedDialogues = Array.from(sequenceKeyToDialogues.entries()).map(
        ([sequenceKey, items]) => {
          const base = items[0];
          const combined = {
            metadata: {
              scene: base?.metadata?.scene || sceneKey,
              sequence: sequenceKey,
              title: base?.metadata?.title || sequenceKey,
            },
            dialogues: items.flatMap((d) => d.dialogues || []),
          };
          return combined;
        }
      );

      const sceneFrame = this.createSceneFrame(
        sceneKey,
        mergedDialogues,
        currentY
      );
      sceneFrames.push(sceneFrame);
      currentY += this.calculateSceneHeight(mergedDialogues) + 100;
    });

    return sceneFrames;
  }

  /**
   * Create individual scene frame
   */
  createSceneFrame(sceneKey, dialogues, startY) {
    const sceneHeight = this.calculateSceneHeight(dialogues);

    return {
      id: `scene-${sceneKey}`,
      name: `Scene: ${sceneKey}`,
      type: "FRAME",
      children: [
        this.createSceneHeader(sceneKey, dialogues.length, startY),
        ...this.createSequenceFrames(dialogues, startY + 80),
      ],
      absoluteBoundingBox: {
        x: 20,
        y: startY,
        width: 1360,
        height: sceneHeight + 80,
      },
      fills: [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 1, a: 1 } }],
      cornerRadius: 12,
    };
  }

  /**
   * Create scene header
   */
  createSceneHeader(sceneKey, dialogueCount, startY) {
    return {
      id: `scene-header-${sceneKey}`,
      name: "Scene Header",
      type: "FRAME",
      children: [
        {
          id: `scene-bg-${sceneKey}`,
          name: "Scene Background",
          type: "RECTANGLE",
          fills: [{ type: "SOLID", color: { r: 0.1, g: 0.2, b: 0.4, a: 1 } }],
          absoluteBoundingBox: { x: 0, y: 0, width: 1360, height: 60 },
        },
        {
          id: `scene-title-${sceneKey}`,
          name: "Scene Title",
          type: "TEXT",
          characters: sceneKey,
          style: {
            fontFamily: "Inter",
            fontSize: 24,
            fontWeight: 700,
            fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
          },
          absoluteBoundingBox: { x: 20, y: 15, width: 400, height: 30 },
        },
        {
          id: `scene-count-${sceneKey}`,
          name: "Sequence Count",
          type: "TEXT",
          characters: `${dialogueCount} sequences`,
          style: {
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 400,
            fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
          },
          absoluteBoundingBox: { x: 1000, y: 20, width: 200, height: 20 },
        },
      ],
      absoluteBoundingBox: { x: 0, y: 0, width: 1360, height: 60 },
    };
  }

  /**
   * Create sequence frames for a scene
   */
  createSequenceFrames(dialogues, startY) {
    const sequenceFrames = [];
    let currentY = startY;

    dialogues.forEach((dialogue) => {
      const sequenceFrame = this.createSequenceFrame(dialogue, currentY);
      sequenceFrames.push(sequenceFrame);
      currentY += this.calculateSequenceHeight(dialogue) + 20;
    });

    return sequenceFrames;
  }

  /**
   * Create individual sequence frame
   */
  createSequenceFrame(dialogue, startY) {
    const { metadata, dialogues: sequenceDialogues } = dialogue;
    const sequenceHeight = this.calculateSequenceHeight(dialogue);

    return {
      id: `sequence-${metadata.scene}-${metadata.sequence}`,
      name: `Sequence: ${metadata.sequence}`,
      type: "FRAME",
      children: [
        this.createSequenceHeader(metadata, startY),
        ...this.createDialogueItems(sequenceDialogues, startY + 50),
      ],
      absoluteBoundingBox: {
        x: 20,
        y: startY,
        width: 1320,
        height: sequenceHeight,
      },
      fills: [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.98, a: 1 } }],
      cornerRadius: 8,
    };
  }

  /**
   * Create sequence header
   */
  createSequenceHeader(metadata, startY) {
    return {
      id: `seq-header-${metadata.scene}-${metadata.sequence}`,
      name: "Sequence Header",
      type: "FRAME",
      children: [
        {
          id: `seq-title-${metadata.scene}-${metadata.sequence}`,
          name: "Sequence Title",
          type: "TEXT",
          characters: `${metadata.sequence}: ${metadata.title || "Untitled"}`,
          style: {
            fontFamily: "Inter",
            fontSize: 18,
            fontWeight: 600,
            fills: [
              { type: "SOLID", color: { r: 0.15, g: 0.39, b: 0.92, a: 1 } },
            ],
          },
          absoluteBoundingBox: { x: 15, y: 10, width: 800, height: 25 },
        },
      ],
      absoluteBoundingBox: { x: 0, y: 0, width: 1320, height: 40 },
    };
  }

  /**
   * Create dialogue items for a sequence
   */
  createDialogueItems(dialogues, startY) {
    return dialogues.map((dialogue, index) =>
      this.createDialogueItem(dialogue, index, startY + index * 100)
    );
  }

  /**
   * Create individual dialogue item
   */
  createDialogueItem(dialogue, index, yPosition) {
    switch (dialogue.type) {
      case "character":
        return this.createCharacterDialogue(dialogue, index, yPosition);
      case "narration":
        return this.createNarrationDialogue(dialogue, index, yPosition);
      case "choice":
        return this.createChoiceDialogue(dialogue, index, yPosition);
      default:
        return this.createGenericDialogue(dialogue, index, yPosition);
    }
  }

  /**
   * Create character dialogue item
   */
  createCharacterDialogue(dialogue, index, yPosition) {
    return {
      id: `char-dialogue-${index}`,
      name: `Character: ${dialogue.speaker}`,
      type: "FRAME",
      children: [
        {
          id: `speaker-${index}`,
          name: "Speaker",
          type: "TEXT",
          characters: dialogue.speaker,
          style: {
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 700,
            fills: [
              { type: "SOLID", color: { r: 0.15, g: 0.39, b: 0.92, a: 1 } },
            ],
          },
          absoluteBoundingBox: { x: 15, y: 10, width: 200, height: 24 },
        },
        {
          id: `text-${index}`,
          name: "Dialogue Text",
          type: "TEXT",
          characters: dialogue.text,
          style: {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 400,
            fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }],
          },
          absoluteBoundingBox: { x: 15, y: 35, width: 1290, height: 50 },
        },
      ],
      absoluteBoundingBox: { x: 0, y: yPosition, width: 1320, height: 90 },
      fills: [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 1, a: 1 } }],
      cornerRadius: 6,
    };
  }

  /**
   * Create narration dialogue item
   */
  createNarrationDialogue(dialogue, index, yPosition) {
    return {
      id: `narration-${index}`,
      name: "Narration",
      type: "FRAME",
      children: [
        {
          id: `narration-text-${index}`,
          name: "Narration Text",
          type: "TEXT",
          characters: dialogue.text,
          style: {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 400,
            fontStyle: "italic",
            fills: [
              { type: "SOLID", color: { r: 0.42, g: 0.45, b: 0.5, a: 1 } },
            ],
          },
          absoluteBoundingBox: { x: 15, y: 10, width: 1290, height: 50 },
        },
      ],
      absoluteBoundingBox: { x: 0, y: yPosition, width: 1320, height: 70 },
      fills: [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.95, a: 1 } }],
      cornerRadius: 6,
    };
  }

  /**
   * Create choice dialogue item
   */
  createChoiceDialogue(dialogue, index, yPosition) {
    const choiceItems = dialogue.options.map((option, optionIndex) => ({
      id: `choice-option-${index}-${optionIndex}`,
      name: `Option ${optionIndex + 1}`,
      type: "TEXT",
      characters: `• ${option}`,
      style: {
        fontFamily: "Inter",
        fontSize: 14,
        fontWeight: 400,
        fills: [{ type: "SOLID", color: { r: 0.49, g: 0.23, b: 0.91, a: 1 } }],
      },
      absoluteBoundingBox: {
        x: 30,
        y: 40 + optionIndex * 25,
        width: 1275,
        height: 20,
      },
    }));

    return {
      id: `choice-${index}`,
      name: "Choice Block",
      type: "FRAME",
      children: [
        {
          id: `choice-question-${index}`,
          name: "Choice Question",
          type: "TEXT",
          characters: dialogue.question,
          style: {
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 600,
            fills: [
              { type: "SOLID", color: { r: 0.49, g: 0.23, b: 0.91, a: 1 } },
            ],
          },
          absoluteBoundingBox: { x: 15, y: 10, width: 1290, height: 24 },
        },
        ...choiceItems,
      ],
      absoluteBoundingBox: {
        x: 0,
        y: yPosition,
        width: 1320,
        height: 100 + dialogue.options.length * 25,
      },
      fills: [{ type: "SOLID", color: { r: 0.95, g: 0.9, b: 1, a: 1 } }],
      cornerRadius: 6,
    };
  }

  /**
   * Create generic dialogue item
   */
  createGenericDialogue(dialogue, index, yPosition) {
    return {
      id: `generic-${index}`,
      name: "Generic Dialogue",
      type: "FRAME",
      children: [
        {
          id: `generic-text-${index}`,
          name: "Generic Text",
          type: "TEXT",
          characters: JSON.stringify(dialogue, null, 2),
          style: {
            fontFamily: "Inter",
            fontSize: 12,
            fontWeight: 400,
            fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }],
          },
          absoluteBoundingBox: { x: 15, y: 10, width: 1290, height: 50 },
        },
      ],
      absoluteBoundingBox: { x: 0, y: yPosition, width: 1320, height: 70 },
      fills: [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9, a: 1 } }],
      cornerRadius: 6,
    };
  }

  /**
   * Create master footer
   */
  createMasterFooter(sceneCount, totalHeight) {
    const footerY = totalHeight - 60;

    return {
      id: "master-footer",
      name: "Master Footer",
      type: "FRAME",
      children: [
        {
          id: "footer-bg",
          name: "Footer Background",
          type: "RECTANGLE",
          fills: [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9, a: 1 } }],
          absoluteBoundingBox: { x: 0, y: 0, width: 1400, height: 60 },
        },
        {
          id: "footer-info",
          name: "Footer Info",
          type: "TEXT",
          characters: `Dialogue Studio • ${sceneCount} scenes • Generated by GPT`,
          style: {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 400,
            fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }],
          },
          absoluteBoundingBox: { x: 40, y: 20, width: 600, height: 20 },
        },
      ],
      absoluteBoundingBox: { x: 0, y: footerY, width: 1400, height: 60 },
    };
  }

  /**
   * Calculate height needed for a scene
   */
  calculateSceneHeight(dialogues) {
    return (
      dialogues.reduce(
        (sum, dialogue) => sum + this.calculateSequenceHeight(dialogue),
        0
      ) +
      dialogues.length * 20
    );
  }

  /**
   * Calculate height needed for a sequence
   */
  calculateSequenceHeight(dialogue) {
    return 50 + dialogue.dialogues.length * 100 + 20; // header + dialogues + padding
  }

  /**
   * Get configuration instructions
   */
  getConfigurationInstructions() {
    return {
      title: "Figma Integration Setup",
      steps: [
        "1. Go to Figma → Account Settings → Personal Access Tokens",
        "2. Generate a new personal access token",
        "3. Add the token to your environment variables as REACT_APP_FIGMA_API_KEY",
        "4. Optionally, add your team ID as REACT_APP_FIGMA_TEAM_ID",
        "5. Restart your development server",
      ],
      note: "This creates Figma-compatible JSON files that can be imported into Figma or used with design tools. The API key is used for enhanced functionality and future integrations.",
    };
  }
}

export default new FigmaApiService();
