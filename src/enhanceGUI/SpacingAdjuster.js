import React, { useCallback, useState } from "react";
import "./Adjuster.css";
import { useFlow } from "../FlowContext";


const SpacingAdjuster = () => {
  const {
    horizontalSpacing,
    verticalSpacing,
    setHorizontalSpacing,
    setVerticalSpacing,
  } = useFlow();
 
  // onChange={(e) => setHorizontalSpacing(e.target.value)}

  const handleHorizontalChange = useCallback((event) => {
    setHorizontalSpacing(Number(event.target.value));
  }, [horizontalSpacing, verticalSpacing]);
  
  const handleVerticalChange = useCallback((event) => {
    setVerticalSpacing(Number(event.target.value));
  }, [horizontalSpacing, verticalSpacing]);

  return (
    <div styles ={{width: "100px", color:"white"}}>
         <span style={{ color: "white" }}>X-SPACING : {horizontalSpacing}</span>
        <input
          display="inline"
          type="range"
          min="200"
          max="500"
          value={horizontalSpacing}
          onChange={handleHorizontalChange}
        />
        <span style={{ color: "white" }}>Y-SPACING : {verticalSpacing}</span> 
        <input
          display="inline"
          type="range"
          min="200"
          max="500"
          value={verticalSpacing}
          onChange={handleVerticalChange}
        />
    </div>
  );
};

export default SpacingAdjuster;
