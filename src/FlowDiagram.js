import React, { useState, useCallback, useRef } from "react";
import ReactFlow from "react-flow-renderer";
import { MiniMap, Controls } from "react-flow-renderer";
import { useFlow } from "./FlowContext";
import ImageNode from "./customNodes/ImageNode";
import CircularNode from "./customNodes/CircularNode";
import CustomNodeComponent from "./customNodes/CustomNodeComponent";
import IconNode from "./customNodes/IconNode";
import myImage from "./logo_1.png";

import SpacingAdjuster from "./enhanceGUI/SpacingAdjuster";

const FlowDiagram = () => {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    history,
    currentHistoryIndex,
    setHistory,
    setCurrentHistoryIndex,
    horizontalSpacing,
    verticalSpacing,
  } = useFlow();
  const reactFlowWrapper = useRef(null);
  const nodeIdRef = useRef(nodes.length + 1);

  const pushToHistory = useCallback(
    (newNodes, newEdges) => {
      const newHistory = history.slice(0, currentHistoryIndex + 1);
      newHistory.push({ nodes: newNodes, edges: newEdges });
      setHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
    },
    [history, currentHistoryIndex]
  );

  const addNode = useCallback(
    (type) => {
      let newNode = {
        id: `node_${nodeIdRef.current++}`,
        type, // This directly assigns the type passed to the function
        position: {
          x: Math.random() * window.innerWidth * 0.5,
          y: Math.random() * window.innerHeight * 0.5,
        },
      };

      // Adjust data based on node type
      // change done by sudeep the label should be (nodeIdRef.cuurent -1)
      if (type === "circular" || type === "iconNode" || type === "imageNode") {
        newNode.data = {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node ${
            nodeIdRef.current - 1
          }`,
        };
        if (type === "imageNode") {
          newNode.data.imageUrl = myImage; // Directly use the imported image for image nodes
        }
      } else {
        // Default and other predefined types like 'input' or 'output'
        newNode.data = {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node ${
            nodeIdRef.current
          }`,
        };
      }

      const newNodes = [...nodes, newNode];
      pushToHistory(newNodes, edges);
      setNodes(newNodes);
    },
    [nodes, edges, pushToHistory]
  );

  // returns true if we noeed to prevent connection between two nodes
  // or simply returns true if there are no cycles in the graph
  function shouldPreventConnection(nodes, edges, sourceNode, targetNode) {
    // if the target not is circular
    if (targetNode.type === "circular") {
      return false;
    }

    const graph = new Map();
    edges.forEach((edge) => {
      if (!graph.has(edge.source)) {
        graph.set(edge.source, []);
      }
      graph.get(edge.source).push(edge.target);

      if (!graph.has(edge.target)) {
        graph.set(edge.target, []);
      }
      graph.get(edge.target).push(edge.source);
    });

    function DFS(graph, visited, node, parentNode) {
      visited.add(node);
      for (let neighbor of graph.get(node) || []) {
        if (neighbor === parentNode) continue;
        if (visited.has(neighbor)) continue;
        DFS(graph, visited, neighbor, node);
      }
    }

    // if the target node is not circular
    const visited = new Set();
    let parentNode = "null";

    DFS(graph, visited, sourceNode.id, parentNode);
    if (visited.has(targetNode.id)) return true; // return true if both source and target nodes are in the same connected component

    return false;
  }

  // returns an array of [size of connected Component, id of root node for the connected component] for all the connected components of the graph
  function findConnectedComponents(nodes, edges) {
    // Build Graph
    const graph = new Map();
    edges.forEach((edge) => {
      if (!graph.has(edge.source)) {
        graph.set(edge.source, []);
      }
      if (!graph.has(edge.target)) {
        graph.set(edge.target, []);
      }
      graph.get(edge.source).push(edge.target);
      graph.get(edge.target).push(edge.source);
    });

    const visited = new Set();
    const rootNodes = [];

    // Helper function to perform DFS and find all the nodes of a connected component
    function dfs(nodeId, componentNodes) {
      visited.add(nodeId);
      componentNodes.push(nodeId);

      (graph.get(nodeId) || []).forEach((neighborNodeId) => {
        if (!visited.has(neighborNodeId)) {
          dfs(neighborNodeId, componentNodes);
        }
      });
    }

    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        const componentNodes = [];
        dfs(node.id, componentNodes);

        // once we have all the nodes in a connnected component, we choose that node as the root node, which is at the top or has the minimum "y" value
        let minY = "null";
        let rootNodeId = "null";
        for (let i = 0; i < componentNodes.length; i++) {
          const componentNodeId = componentNodes[i];

          const componentNode = nodes.find(
            (currNode) => currNode.id === componentNodeId
          );
          const componentNodeY = componentNode.position.y;

          if (minY === "null") {
            minY = componentNodeY;
            rootNodeId = componentNodeId;
          }
          if (componentNodeY < minY) {
            minY = componentNodeY;
            rootNodeId = componentNodeId;
          }
        }

        rootNodes.push([componentNodes.length, rootNodeId]);
      }
    });

    return rootNodes;
  }

  // function to find whether a node is a leaf node or not
  function isLeafNode(updatedNodes, updatedEdges, currNodeId) {
    let NumberOfEdgesFromCurrNode = 0;
    let totalNumberOfEdges = 0;
    for (let i = 0; i < updatedEdges.length; i++) {
      if (updatedEdges[i].source === currNodeId) {
        NumberOfEdgesFromCurrNode++;
      }
      if (
        updatedEdges[i].source === currNodeId ||
        updatedEdges[i].target == currNodeId
      ) {
        totalNumberOfEdges++;
      }
    }
    if (totalNumberOfEdges == 0) return false;

    return NumberOfEdgesFromCurrNode === 0;
  }

  // function to assign paraller end tags to leaf nodes with unique branch ids, returns updated nodes
  function assignParallelEnds(updatedNodes, updatedEdges) {
    let branchId = 1;
    for (let i = 0; i < updatedNodes.length; i++) {
      const currNode = updatedNodes[i];

      if (isLeafNode(updatedNodes, updatedEdges, currNode.id)) {
        // currNode is a leaf node
        // update the label to "Parallel end" if it is a leaf node
        updatedNodes = updatedNodes.map((node) => {
          if (node.id === currNode.id) {
            return {
              ...node,
              data: { ...node.data, label: `Parallel End ${branchId}` },
            };
          }
          return node;
        });
        branchId++;
      } else {
        // if it is a non-leaf node, change the label to original one
        updatedNodes = updatedNodes.map((node) => {
          if (node.id === currNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                label: `${
                  node.type.charAt(0).toUpperCase() + node.type.slice(1)
                } ${node.id}`,
              },
            };
          }
          return node;
        });
      }
    }
    return updatedNodes;
  }

  // fucntion called when we try to connect two nodes
  const onConnect = useCallback(
    (params) => {
      const { source, target } = params;
      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);

      let updatedNodes = [...nodes]; // Clone the current nodes array
      let updatedEdges = [...edges, { id: `e${source}-${target}`, ...params }]; // Clone the current edges array

      // Proceed with adding the edge if the connection is valid
      if (!shouldPreventConnection(nodes, edges, sourceNode, targetNode)) {
        pushToHistory(nodes, edges);
        setEdges((eds) => [...eds, { id: `e${source}-${target}`, ...params }]);
        updatedNodes = assignParallelEnds(updatedNodes, updatedEdges);
        setNodes(updatedNodes);
      } else alert("The connection you are trying to make is not allowed");
      console.log(nodes);
    },
    [nodes, edges, setEdges, setNodes, pushToHistory]
  );

  const onNodeDragStop = useCallback(
    (event, node) => {
      let newNodes = nodes.map((nd) => {
        if (nd.id === node.id) {
          return {
            ...nd,
            position: node.position,
          };
        }
        return nd;
      });
      newNodes = assignParallelEnds(newNodes, edges);
      pushToHistory(newNodes, edges);
      setNodes(newNodes);
    },
    [nodes, edges, pushToHistory]
  );

  // This function performs BFS traversal starting from startNodeId. and assigns x and y valyes to all the nodes of the concerned connected component
  function traverseBFS(
    nodes,
    edges,
    startNodeId,
    position,
    currX,
    currY,
    verticalSpacing,
    horizontalSpacing
  ) {
    // Build graph from nodes and edged
    const graph = new Map();
    edges.forEach((edge) => {
      if (!graph.has(edge.source)) {
        graph.set(edge.source, []);
      }
      if (!graph.has(edge.target)) {
        graph.set(edge.target, []);
      }
      graph.get(edge.source).push(edge.target);
      graph.get(edge.target).push(edge.source);
    });

    let levelWiseNodes = {}; // Object to store an array of nodes for each level
    let levels = {}; // Object to store the level of each node
    let queue = [startNodeId];

    // setting levels for the rootNode
    levels[startNodeId] = 0;
    levelWiseNodes[0] = [];
    levelWiseNodes[0].push(startNodeId);

    // setting positions for the root Node
    position[startNodeId] = { x: currX, y: currY };

    let numLevels = 0;

    while (queue.length > 0) {
      let nodeId = queue.shift(); // Dequeue a node

      if (!graph.has(nodeId)) break;
      let neighbors = graph.get(nodeId); // Get neighbors of the current node

      for (let neighborNodeId of neighbors) {
        if (!(neighborNodeId in levels)) {
          // setting levels for the currNode
          levels[neighborNodeId] = levels[nodeId] + 1;
          if (!(levels[neighborNodeId] in levelWiseNodes))
            levelWiseNodes[levels[neighborNodeId]] = [];
          levelWiseNodes[levels[neighborNodeId]].push(neighborNodeId);

          queue.push(neighborNodeId);
          if (numLevels < levels[neighborNodeId])
            numLevels = levels[neighborNodeId];
        }
      }
    }

    for (let lev = 1; lev <= numLevels; lev++) {
      currY += verticalSpacing;

      const nodesAtLevel = levelWiseNodes[lev];
      let totalWidth = (nodesAtLevel.length - 1) * horizontalSpacing;
      let startX = currX - totalWidth / 2; // Start x position to center nodes

      for (let i = 0; i < nodesAtLevel.length; i++) {
        let x = startX + i * horizontalSpacing;
        let node = nodesAtLevel[i];
        position[node] = { x: x, y: currY };
      }
    }
    currY += verticalSpacing;

    console.log("level wise nodes", levelWiseNodes);

    return currY;
  }

  const makeNodesEquispacedAndCentered = useCallback(() => {
    if (!reactFlowWrapper.current) return;

    console.log(horizontalSpacing, verticalSpacing);
    const containerWidth = reactFlowWrapper.current.offsetWidth;
    const centerX = containerWidth / 2;

    let updatedNodes = [...nodes]; // Clone the current nodes array

    // define coordinates of current rootNode being processed
    let currX = centerX - 50;
    let currY = 30;

    // get rootNodes and sort it in decreasing order of component size
    const rootNodes = findConnectedComponents(nodes, edges);
    rootNodes.sort((a, b) => b[0] - a[0]);

    // define an object position which maps ecah nodeId with its x and y values
    let position = {};

    for (let i = 0; i < rootNodes.length; i++) {
      const nextYLevel = traverseBFS(
        nodes,
        edges,
        rootNodes[i][1],
        position,
        currX,
        currY,
        verticalSpacing,
        horizontalSpacing
      );
      currY = nextYLevel;
    }

    updatedNodes = updatedNodes.map((node) => {
      if (position[node.id]) {
        return {
          ...node,
          position: {
            x: position[node.id].x,
            y: position[node.id].y,
          },
        };
      }
      return node; // If position not found, return the node as is
    });

    pushToHistory(updatedNodes, edges);
    setNodes(updatedNodes);
    console.log(updatedNodes);
  }, [nodes, edges, pushToHistory, horizontalSpacing, verticalSpacing]);

  const undo = useCallback(() => {
    if (currentHistoryIndex === 0) return;
    const newIndex = currentHistoryIndex - 1;
    const prevState = history[newIndex];
    setCurrentHistoryIndex(newIndex);
    setNodes(prevState.nodes);
    setEdges(prevState.edges);
  }, [history, currentHistoryIndex]);

  const redo = useCallback(() => {
    if (currentHistoryIndex >= history.length - 1) return;
    const newIndex = currentHistoryIndex + 1;
    const nextState = history[newIndex];
    setCurrentHistoryIndex(newIndex);
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
  }, [history, currentHistoryIndex]);

  // React Flow setup and event handlers here
  const nodeTypes = {
    customNodeType: CustomNodeComponent,
    circular: CircularNode,
    imageNode: ImageNode,
    iconNode: IconNode,
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ margin: "10px", display: "flex", alignItems: "center" }}>
        <button onClick={makeNodesEquispacedAndCentered}>
          Equispace Nodes
        </button>
        <SpacingAdjuster />
      </div>
      <div style={{ justifyContent: "space-evenly", padding: "10px" }}>
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
        <button onClick={() => addNode("circular")}>Add Circular Node</button>
        <button onClick={() => addNode("iconNode")}>Add ICON Node</button>
        <button onClick={() => addNode("imageNode")}>Add Image Node</button>
        <button onClick={() => addNode("default")}>Add Default Node</button>
      </div>
      <div ref={reactFlowWrapper} style={{ height: "100vh" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeDragStop={onNodeDragStop}
          // other props
        >
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default FlowDiagram;

// function shouldPreventConnection(sourceNode, targetNode) {
//   // Rule 1: Prevent direct connections between circular nodes
//   if (sourceNode.type === 'circular' && targetNode.type === 'circular') {
//     alert("Can't connect two circular nodes.....")
//     return true;
//   }
//   const sourceBranch = sourceNode.data.branch; // Assuming 'branch' is a property indicating the node's branch
//   const targetBranch = targetNode.data.branch;

//   // Check if both branches are defined before comparing them
//   if (sourceBranch && targetBranch && sourceBranch !== targetBranch) {
//     alert(`Cannot connect nodes from different branches: ${sourceBranch} to ${targetBranch}`);
//     return true; // Prevents connecting nodes from different branches
//   }

// // Rule 2: Optionally, prevent connecting back to a node that's already in the path
// // This requires checking the edges to see if making this connection creates a loop
//   const createsLoop = edges.some(edge => edge.source === targetNode.id && edge.target === sourceNode.id);
//   if (createsLoop) {
//     return true;
//   }

//   // Example: Prevent connecting if both nodes are of a specific type that shouldn't be connected
//   // Adjust the logic as necessary
//   return false; // Placeholder logic
// }
