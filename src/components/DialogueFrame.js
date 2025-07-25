import React from "react";

const DialogueFrame = React.forwardRef(({ dialogue, name }, ref) => {
  if (!dialogue) {
    return null;
  }

  return (
    <div
      ref={ref}
      data-name={name}
      className="p-4 bg-white border border-gray-300 rounded-lg shadow-md"
      style={{ width: "400px" }}
    >
      {dialogue.map((item, index) => (
        <div key={index} className="mb-2">
          {item.type === "character" && (
            <div>
              <span className="font-bold">{item.speaker}:</span> {item.text}
            </div>
          )}
          {item.type === "narration" && (
            <div className="italic">{item.text}</div>
          )}
        </div>
      ))}
    </div>
  );
});

export default DialogueFrame;
