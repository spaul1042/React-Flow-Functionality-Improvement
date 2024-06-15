// returns true if connection between two nodes is possible
// or simply returns true if there are no cycles in the graph
function shouldPreventConnection(updatedNodes, updatedEdges) {
  // Build graph
  const graph = new Map();
  updatedEdges.forEach((edge) => {
    if (!graph.has(edge.source)) {
      graph.set(edge.source, []);
    }
    graph.get(edge.source).push(edge.target);

    if (!graph.has(edge.target)) {
      graph.set(edge.target, []);
    }
    graph.get(edge.target).push(edge.source);
  });

  function hasCycleDFS(graph, visited, node, parentNode) {
    visited.add(node);
    let hasCycle = false;
    for (let neighbor of graph.get(node) || []) {
      if (neighbor === parentNode) continue;
      if (visited.has(neighbor)) return true;
      if (hasCycleDFS(graph, visited, neighbor, node)) return true;
    }

    return false;
  }

  const visited = new Set();
  let parentNode = "null";

  let cyclePresent = false;
  for (let node of updatedNodes) {
    if (
      !visited.has(node.id) &&
      hasCycleDFS(graph, visited, node.id, parentNode)
    ) {
      cyclePresent = cyclePresent || true;
    }
  }
  return cyclePresent;
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
  for (let i = 0; i < updatedEdges.length; i++) {
    if (
      updatedEdges[i].source === currNodeId ||
      updatedEdges[i].target === currNodeId
    ) {
      NumberOfEdgesFromCurrNode++;
    }
  }
  return NumberOfEdgesFromCurrNode === 1;
}

// function to assign paraller end tags to leaf nodes with unique branch ids, returns updated nodes
function assignParallelEnds(updatedNodes, updatedEdges) {
  const rootNodes = findConnectedComponents(updatedNodes, updatedEdges);

  // assigning end of branch label to leaf nodes with unique branch ids
  let branchId = 1;
  for (let i = 0; i < updatedNodes.length; i++) {
    const currNode = updatedNodes[i];

    if (
      !(rootNodes.filter((arr) => arr[1] === currNode.id).length > 0) &&
      isLeafNode(updatedNodes, updatedEdges, currNode.id)
    ) {
      // currNode is not a root node but is a leaf node
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
      // setNodes(updatedNodes);
      branchId++;
    } else {
      // if its either a root or a non-leaf node, change the label to original one
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



export { shouldPreventConnection, findConnectedComponents, isLeafNode, assignParallelEnds};
