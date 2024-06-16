import React from 'react';
import { FlowProvider } from './FlowContext';
import FlowDiagram from './FlowDiagram';
import NodeControl from './NodeControl';
import './App.css';

function App() {
  return (
    <FlowProvider>
      <NodeControl />
      <div className="container">
        <FlowDiagram />
      </div>
      
    </FlowProvider>
  );
}

export default App;
