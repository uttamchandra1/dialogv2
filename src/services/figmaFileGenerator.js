/**
 * Figma File Generator Service
 * Generates Figma-compatible JSON files for dialogue visualization
 */

class FigmaFileGenerator {
  constructor() {
    this.defaultColors = {
      background: "#FFFFFF",
      text: "#000000",
      character: "#2563EB",
      narration: "#6B7280",
      choice: "#7C3AED",
      choiceOption: "#059669",
    };

    this.defaultFonts = {
      character: "Inter",
      narration: "Inter",
      choice: "Inter",
    };
  }

  /**
   * Generate a Figma file structure for a dialogue
   * @param {Object} dialogueData - The dialogue data with metadata and dialogues array
   * @returns {Object} - Figma-compatible JSON structure
   */
  generateFigmaFile(dialogueData) {
    const { metadata, dialogues } = dialogueData;

    // Create the main Figma document structure
    const figmaFile = {
      name: `${metadata.scene}_${metadata.sequence}_dialogue`,
      lastModified: new Date().toISOString(),
      version: "1.0.0",
      document: this.createDocument(metadata, dialogues),
      components: this.createComponents(),
      styles: this.createStyles(),
      schemaVersion: 1,
    };

    return figmaFile;
  }

  /**
   * Create the main document structure
   */
  createDocument(metadata, dialogues) {
    const pageWidth = 1200;
    const pageHeight = Math.max(800, dialogues.length * 120 + 200);

    return {
      id: "0:0",
      name: `${metadata.scene} - ${metadata.sequence}`,
      type: "DOCUMENT",
      children: [
        {
          id: "0:1",
          name: "Page 1",
          type: "PAGE",
          children: [
            this.createHeader(metadata),
            this.createDialogueContainer(dialogues),
            this.createFooter(metadata),
          ],
          absoluteBoundingBox: {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          },
          constraints: {
            vertical: "TOP",
            horizontal: "LEFT",
          },
        },
      ],
    };
  }

  /**
   * Create header with scene and sequence information
   */
  createHeader(metadata) {
    return {
      id: "header",
      name: "Header",
      type: "FRAME",
      children: [
        {
          id: "header-bg",
          name: "Header Background",
          type: "RECTANGLE",
          fills: [
            {
              type: "SOLID",
              color: { r: 0.1, g: 0.2, b: 0.4, a: 1 },
            },
          ],
          absoluteBoundingBox: {
            x: 0,
            y: 0,
            width: 1200,
            height: 80,
          },
        },
        {
          id: "scene-title",
          name: "Scene Title",
          type: "TEXT",
          characters: `${metadata.scene} - ${metadata.sequence}`,
          style: {
            fontFamily: "Inter",
            fontSize: 24,
            fontWeight: 700,
            fillStyleId: "white-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: 20,
            width: 400,
            height: 40,
          },
        },
        {
          id: "dialogue-title",
          name: "Dialogue Title",
          type: "TEXT",
          characters: metadata.title || "Untitled Dialogue",
          style: {
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 400,
            fillStyleId: "white-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: 50,
            width: 600,
            height: 20,
          },
        },
      ],
      absoluteBoundingBox: {
        x: 0,
        y: 0,
        width: 1200,
        height: 80,
      },
      fills: [
        {
          type: "SOLID",
          color: { r: 0.1, g: 0.2, b: 0.4, a: 1 },
        },
      ],
    };
  }

  /**
   * Create the main dialogue container
   */
  createDialogueContainer(dialogues) {
    const dialogueItems = dialogues.map((dialogue, index) =>
      this.createDialogueItem(dialogue, index)
    );

    return {
      id: "dialogue-container",
      name: "Dialogue Container",
      type: "FRAME",
      children: dialogueItems,
      absoluteBoundingBox: {
        x: 0,
        y: 80,
        width: 1200,
        height: dialogues.length * 120 + 40,
      },
      fills: [
        {
          type: "SOLID",
          color: { r: 1, g: 1, b: 1, a: 1 },
        },
      ],
      layoutMode: "VERTICAL",
      primaryAxisAlignItems: "MIN",
      counterAxisAlignItems: "MIN",
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 40,
      paddingRight: 40,
      itemSpacing: 20,
    };
  }

  /**
   * Create individual dialogue item
   */
  createDialogueItem(dialogue, index) {
    const yPosition = 100 + index * 120;

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
      id: `dialogue-${index}`,
      name: `Character Dialogue - ${dialogue.speaker}`,
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
            fillStyleId: "character-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: yPosition,
            width: 200,
            height: 24,
          },
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
            fillStyleId: "default-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: yPosition + 30,
            width: 1120,
            height: 60,
          },
        },
      ],
      absoluteBoundingBox: {
        x: 0,
        y: yPosition - 20,
        width: 1200,
        height: 100,
      },
      fills: [
        {
          type: "SOLID",
          color: { r: 0.98, g: 0.98, b: 1, a: 1 },
        },
      ],
      cornerRadius: 8,
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 20,
      paddingRight: 20,
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
            fillStyleId: "narration-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: yPosition,
            width: 1120,
            height: 60,
          },
        },
      ],
      absoluteBoundingBox: {
        x: 0,
        y: yPosition - 20,
        width: 1200,
        height: 100,
      },
      fills: [
        {
          type: "SOLID",
          color: { r: 0.95, g: 0.95, b: 0.95, a: 1 },
        },
      ],
      cornerRadius: 8,
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 20,
      paddingRight: 20,
    };
  }

  /**
   * Create choice dialogue item
   */
  createChoiceDialogue(dialogue, index, yPosition) {
    const choiceItems = dialogue.options.map((option, optionIndex) => ({
      id: `choice-option-${index}-${optionIndex}`,
      name: `Choice Option ${optionIndex + 1}`,
      type: "TEXT",
      characters: `• ${option}`,
      style: {
        fontFamily: "Inter",
        fontSize: 14,
        fontWeight: 400,
        fillStyleId: "choice-text",
      },
      absoluteBoundingBox: {
        x: 60,
        y: yPosition + 40 + optionIndex * 25,
        width: 1100,
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
            fillStyleId: "choice-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: yPosition,
            width: 1120,
            height: 24,
          },
        },
        ...choiceItems,
      ],
      absoluteBoundingBox: {
        x: 0,
        y: yPosition - 20,
        width: 1200,
        height: 100 + dialogue.options.length * 25,
      },
      fills: [
        {
          type: "SOLID",
          color: { r: 0.95, g: 0.9, b: 1, a: 1 },
        },
      ],
      cornerRadius: 8,
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 20,
      paddingRight: 20,
    };
  }

  /**
   * Create generic dialogue item for unknown types
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
            fillStyleId: "default-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: yPosition,
            width: 1120,
            height: 60,
          },
        },
      ],
      absoluteBoundingBox: {
        x: 0,
        y: yPosition - 20,
        width: 1200,
        height: 100,
      },
      fills: [
        {
          type: "SOLID",
          color: { r: 0.9, g: 0.9, b: 0.9, a: 1 },
        },
      ],
      cornerRadius: 8,
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 20,
      paddingRight: 20,
    };
  }

  /**
   * Create footer with metadata
   */
  createFooter(metadata) {
    const footerY = 100 + (metadata.dialogues?.length || 0) * 120 + 40;

    return {
      id: "footer",
      name: "Footer",
      type: "FRAME",
      children: [
        {
          id: "footer-bg",
          name: "Footer Background",
          type: "RECTANGLE",
          fills: [
            {
              type: "SOLID",
              color: { r: 0.9, g: 0.9, b: 0.9, a: 1 },
            },
          ],
          absoluteBoundingBox: {
            x: 0,
            y: footerY,
            width: 1200,
            height: 60,
          },
        },
        {
          id: "timestamp",
          name: "Timestamp",
          type: "TEXT",
          characters: `Generated: ${new Date().toLocaleString()}`,
          style: {
            fontFamily: "Inter",
            fontSize: 12,
            fontWeight: 400,
            fillStyleId: "default-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: footerY + 20,
            width: 300,
            height: 16,
          },
        },
        {
          id: "scene-info",
          name: "Scene Info",
          type: "TEXT",
          characters: `${metadata.scene} - ${metadata.sequence}`,
          style: {
            fontFamily: "Inter",
            fontSize: 12,
            fontWeight: 400,
            fillStyleId: "default-text",
          },
          absoluteBoundingBox: {
            x: 800,
            y: footerY + 20,
            width: 300,
            height: 16,
          },
        },
      ],
      absoluteBoundingBox: {
        x: 0,
        y: footerY,
        width: 1200,
        height: 60,
      },
    };
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
        fills: [
          {
            type: "SOLID",
            color: { r: 1, g: 1, b: 1, a: 1 },
          },
        ],
      },
      "character-text": {
        id: "character-text-style",
        name: "Character Text",
        type: "TEXT",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.15, g: 0.39, b: 0.92, a: 1 },
          },
        ],
      },
      "narration-text": {
        id: "narration-text-style",
        name: "Narration Text",
        type: "TEXT",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.42, g: 0.45, b: 0.5, a: 1 },
          },
        ],
      },
      "choice-text": {
        id: "choice-text-style",
        name: "Choice Text",
        type: "TEXT",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.49, g: 0.23, b: 0.91, a: 1 },
          },
        ],
      },
      "default-text": {
        id: "default-text-style",
        name: "Default Text",
        type: "TEXT",
        fills: [
          {
            type: "SOLID",
            color: { r: 0, g: 0, b: 0, a: 1 },
          },
        ],
      },
    };
  }

  /**
   * Generate Figma file for a single dialogue and return as JSON string
   * @param {Object} dialogueData - The dialogue data
   * @returns {string} - JSON string of the Figma file
   */
  generateFigmaFileString(dialogueData) {
    const figmaFile = this.generateFigmaFile(dialogueData);
    return JSON.stringify(figmaFile, null, 2);
  }

  /**
   * Generate a single Figma-compatible file containing all dialogues organized by scene and sequence
   * @param {Array} batchDialogues - Array of dialogue data objects
   * @returns {Object} - Single Figma-compatible file structure with all dialogues
   */
  generateSingleFigmaFile(batchDialogues) {
    // Group dialogues by scene
    const scenesMap = new Map();

    batchDialogues.forEach((dialogue) => {
      const { metadata } = dialogue;
      const sceneKey = metadata.scene;

      if (!scenesMap.has(sceneKey)) {
        scenesMap.set(sceneKey, []);
      }
      scenesMap.get(sceneKey).push(dialogue);
    });

    // Calculate total height needed
    const totalDialogues = batchDialogues.reduce(
      (sum, dialogue) => sum + dialogue.dialogues.length,
      0
    );
    const totalHeight = Math.max(
      1200,
      totalDialogues * 100 + scenesMap.size * 200 + 300
    );

    // Create a Figma-compatible document structure
    const figmaFile = {
      name: "Dialogues_with_Figma",
      lastModified: new Date().toISOString(),
      version: "1.0.0",
      document: this.createMultiSceneDocument(scenesMap, totalHeight),
      components: this.createComponents(),
      styles: this.createStyles(),
      schemaVersion: 1,
      // Add Figma-specific metadata
      figmaVersion: "1.0.0",
      fileType: "figma-document",
      exportSettings: {
        format: "PNG",
        constraint: "SCALE",
        value: 1,
      },
    };

    return figmaFile;
  }

  /**
   * Create document structure for multiple scenes
   */
  createMultiSceneDocument(scenesMap, totalHeight) {
    const pageWidth = 1400;
    const pageHeight = totalHeight;

    // Create all scene pages
    const scenePages = [];
    let currentY = 0;

    scenesMap.forEach((dialogues, sceneKey) => {
      const scenePage = this.createScenePage(
        sceneKey,
        dialogues,
        currentY,
        pageWidth
      );
      scenePages.push(scenePage);
      currentY += this.calculateSceneHeight(dialogues) + 100; // Add spacing between scenes
    });

    return {
      id: "0:0",
      name: "All Dialogues",
      type: "DOCUMENT",
      children: [
        {
          id: "0:1",
          name: "All Scenes",
          type: "PAGE",
          children: [
            this.createMasterHeader(scenesMap.size),
            ...scenePages,
            this.createMasterFooter(scenesMap.size, totalHeight),
          ],
          absoluteBoundingBox: {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          },
          constraints: {
            vertical: "TOP",
            horizontal: "LEFT",
          },
        },
      ],
    };
  }

  /**
   * Create master header for all scenes
   */
  createMasterHeader(sceneCount) {
    return {
      id: "master-header",
      name: "Master Header",
      type: "FRAME",
      children: [
        {
          id: "master-header-bg",
          name: "Master Header Background",
          type: "RECTANGLE",
          fills: [
            {
              type: "SOLID",
              color: { r: 0.05, g: 0.1, b: 0.3, a: 1 },
            },
          ],
          absoluteBoundingBox: {
            x: 0,
            y: 0,
            width: 1400,
            height: 100,
          },
        },
        {
          id: "master-title",
          name: "Master Title",
          type: "TEXT",
          characters: "Dialogue Studio - All Scenes",
          style: {
            fontFamily: "Inter",
            fontSize: 32,
            fontWeight: 800,
            fillStyleId: "white-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: 20,
            width: 600,
            height: 40,
          },
        },
        {
          id: "scene-count",
          name: "Scene Count",
          type: "TEXT",
          characters: `${sceneCount} scenes • ${this.getTotalDialogues()} total dialogues`,
          style: {
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 400,
            fillStyleId: "white-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: 60,
            width: 400,
            height: 20,
          },
        },
        {
          id: "generated-time",
          name: "Generated Time",
          type: "TEXT",
          characters: `Generated: ${new Date().toLocaleString()}`,
          style: {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 400,
            fillStyleId: "white-text",
          },
          absoluteBoundingBox: {
            x: 1000,
            y: 60,
            width: 300,
            height: 20,
          },
        },
      ],
      absoluteBoundingBox: {
        x: 0,
        y: 0,
        width: 1400,
        height: 100,
      },
      fills: [
        {
          type: "SOLID",
          color: { r: 0.05, g: 0.1, b: 0.3, a: 1 },
        },
      ],
    };
  }

  /**
   * Create individual scene page
   */
  createScenePage(sceneKey, dialogues, startY, pageWidth) {
    const sceneHeight = this.calculateSceneHeight(dialogues);

    return {
      id: `scene-${sceneKey}`,
      name: `Scene: ${sceneKey}`,
      type: "FRAME",
      children: [
        this.createSceneHeader(sceneKey, dialogues.length, startY),
        this.createSceneDialoguesContainer(dialogues, startY + 80),
      ],
      absoluteBoundingBox: {
        x: 0,
        y: startY,
        width: pageWidth,
        height: sceneHeight + 80,
      },
      fills: [
        {
          type: "SOLID",
          color: { r: 0.98, g: 0.98, b: 1, a: 1 },
        },
      ],
      cornerRadius: 12,
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 20,
      paddingRight: 20,
    };
  }

  /**
   * Create scene header
   */
  createSceneHeader(sceneKey, dialogueCount, startY) {
    return {
      id: `scene-header-${sceneKey}`,
      name: `Scene Header: ${sceneKey}`,
      type: "FRAME",
      children: [
        {
          id: `scene-header-bg-${sceneKey}`,
          name: "Scene Header Background",
          type: "RECTANGLE",
          fills: [
            {
              type: "SOLID",
              color: { r: 0.1, g: 0.2, b: 0.4, a: 1 },
            },
          ],
          absoluteBoundingBox: {
            x: 20,
            y: startY + 20,
            width: 1360,
            height: 60,
          },
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
            fillStyleId: "white-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: startY + 35,
            width: 400,
            height: 30,
          },
        },
        {
          id: `scene-dialogue-count-${sceneKey}`,
          name: "Dialogue Count",
          type: "TEXT",
          characters: `${dialogueCount} sequences`,
          style: {
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 400,
            fillStyleId: "white-text",
          },
          absoluteBoundingBox: {
            x: 1000,
            y: startY + 40,
            width: 200,
            height: 20,
          },
        },
      ],
      absoluteBoundingBox: {
        x: 20,
        y: startY + 20,
        width: 1360,
        height: 60,
      },
    };
  }

  /**
   * Create container for all dialogues in a scene
   */
  createSceneDialoguesContainer(dialogues, startY) {
    const dialogueItems = [];
    let currentY = startY;

    dialogues.forEach((dialogue, index) => {
      const sequenceItems = this.createSequenceBlock(dialogue, currentY);
      dialogueItems.push(sequenceItems);
      currentY += this.calculateSequenceHeight(dialogue) + 20;
    });

    return {
      id: `scene-dialogues-${dialogues[0]?.metadata?.scene}`,
      name: "Scene Dialogues Container",
      type: "FRAME",
      children: dialogueItems,
      absoluteBoundingBox: {
        x: 20,
        y: startY,
        width: 1360,
        height: currentY - startY,
      },
      layoutMode: "VERTICAL",
      primaryAxisAlignItems: "MIN",
      counterAxisAlignItems: "MIN",
      itemSpacing: 20,
    };
  }

  /**
   * Create a sequence block with all its dialogues
   */
  createSequenceBlock(dialogue, startY) {
    const { metadata, dialogues: sequenceDialogues } = dialogue;
    const sequenceHeight = this.calculateSequenceHeight(dialogue);

    return {
      id: `sequence-${metadata.scene}-${metadata.sequence}`,
      name: `Sequence: ${metadata.sequence}`,
      type: "FRAME",
      children: [
        this.createSequenceHeader(metadata, startY),
        ...sequenceDialogues.map((seqDialogue, index) =>
          this.createDialogueItem(seqDialogue, index, startY + 60 + index * 100)
        ),
      ],
      absoluteBoundingBox: {
        x: 0,
        y: startY,
        width: 1360,
        height: sequenceHeight,
      },
      fills: [
        {
          type: "SOLID",
          color: { r: 0.95, g: 0.95, b: 0.98, a: 1 },
        },
      ],
      cornerRadius: 8,
      paddingTop: 15,
      paddingBottom: 15,
      paddingLeft: 15,
      paddingRight: 15,
    };
  }

  /**
   * Create sequence header
   */
  createSequenceHeader(metadata, startY) {
    return {
      id: `sequence-header-${metadata.scene}-${metadata.sequence}`,
      name: "Sequence Header",
      type: "FRAME",
      children: [
        {
          id: `sequence-title-${metadata.scene}-${metadata.sequence}`,
          name: "Sequence Title",
          type: "TEXT",
          characters: `${metadata.sequence}: ${metadata.title || "Untitled"}`,
          style: {
            fontFamily: "Inter",
            fontSize: 18,
            fontWeight: 600,
            fillStyleId: "character-text",
          },
          absoluteBoundingBox: {
            x: 15,
            y: startY + 15,
            width: 800,
            height: 25,
          },
        },
        {
          id: `sequence-meta-${metadata.scene}-${metadata.sequence}`,
          name: "Sequence Metadata",
          type: "TEXT",
          characters: `${
            metadata.timestamp
              ? new Date(metadata.timestamp).toLocaleDateString()
              : "No date"
          }`,
          style: {
            fontFamily: "Inter",
            fontSize: 12,
            fontWeight: 400,
            fillStyleId: "narration-text",
          },
          absoluteBoundingBox: {
            x: 1000,
            y: startY + 20,
            width: 200,
            height: 15,
          },
        },
      ],
      absoluteBoundingBox: {
        x: 0,
        y: startY,
        width: 1360,
        height: 45,
      },
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
          id: "master-footer-bg",
          name: "Master Footer Background",
          type: "RECTANGLE",
          fills: [
            {
              type: "SOLID",
              color: { r: 0.9, g: 0.9, b: 0.9, a: 1 },
            },
          ],
          absoluteBoundingBox: {
            x: 0,
            y: footerY,
            width: 1400,
            height: 60,
          },
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
            fillStyleId: "default-text",
          },
          absoluteBoundingBox: {
            x: 40,
            y: footerY + 20,
            width: 600,
            height: 20,
          },
        },
      ],
      absoluteBoundingBox: {
        x: 0,
        y: footerY,
        width: 1400,
        height: 60,
      },
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
    return 60 + dialogue.dialogues.length * 100 + 30; // header + dialogues + padding
  }

  /**
   * Get total dialogue count (helper method)
   */
  getTotalDialogues() {
    // This will be set by the calling function
    return this.totalDialogues || 0;
  }

  /**
   * Generate single Figma file string for all dialogues
   * @param {Array} batchDialogues - Array of dialogue data objects
   * @returns {string} - JSON string of the single Figma file
   */
  generateSingleFigmaFileString(batchDialogues) {
    this.totalDialogues = batchDialogues.reduce(
      (sum, dialogue) => sum + dialogue.dialogues.length,
      0
    );
    const figmaFile = this.generateSingleFigmaFile(batchDialogues);
    return JSON.stringify(figmaFile, null, 2);
  }

  /**
   * Generate multiple Figma files for batch export (legacy method)
   * @param {Array} batchDialogues - Array of dialogue data objects
   * @returns {Object} - Object with file paths as keys and Figma file content as values
   */
  generateBatchFigmaFiles(batchDialogues) {
    const figmaFiles = {};

    batchDialogues.forEach((dialogue) => {
      const { metadata } = dialogue;
      const scenePath = metadata.scene;
      const sequencePath = `${scenePath}/${metadata.sequence}`;
      const filePath = `${sequencePath}/dialogue.figma.json`;

      figmaFiles[filePath] = this.generateFigmaFileString(dialogue);
    });

    return figmaFiles;
  }
}

export default new FigmaFileGenerator();
