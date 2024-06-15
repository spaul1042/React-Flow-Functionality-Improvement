import React from 'react';
import { Handle } from 'react-flow-renderer';
import { useFlow } from '../FlowContext'; // Ensure the correct path
import myImage from '../logo_1.png'; // Update the path accordingly

const CircularNode = ({ id, data }) => {
  const { deleteNode } = useFlow();

  const handleDelete = () => {
    deleteNode(id);
  };
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '120px',
      height: '120px',
      backgroundColor: '#D6D5E6',
      borderRadius: '50%', // Makes the div circular
      border: '2px solid #333',
    }}>
      <Handle type="target" position="top" />
      <img src={myImage} alt="" style={{ width: '50px', height: '50px',justifyContent: 'center', }} />
      <div>{data.label}</div>
      <Handle type="source" position="bottom" />
      <div style={{
        position: 'absolute', // Positioning the button absolutely
        bottom: '10px', // Position the button 10px from the bottom
        left: '50%', // Center horizontally
        transform: 'translateX(-50%)' // Center the button
      }}>
        <button onClick={handleDelete}>Delete</button>
      </div>

      {/* <Handle type="target" position="top" />
      <img src={myImage} alt="" style={{ width: '50px', height: '50px' }} />
      <div>{data.label}</div>
      <Handle type="source" position="bottom" />
      <button onClick={handleDelete} style={{ marginTop: '10px' }}>Delete</button> */}

    </div>
  );
};
export default CircularNode;
