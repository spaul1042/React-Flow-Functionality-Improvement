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


export { shouldPreventConnection, findConnectedComponents, isLeafNode, assignParallelEnds};
