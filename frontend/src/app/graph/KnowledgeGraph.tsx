import React, { useEffect, useState } from 'react';
import ForceGraph2D, { NodeObject, LinkObject } from 'react-force-graph-2d';
import axios from 'axios';

interface GraphNode extends NodeObject {
  id: string;
  name: string;
  level?: number;
}

interface GraphLink extends LinkObject {
  source: string;
  target: string;
  weight?: number;
}

interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const KnowledgeGraph: React.FC<{ userId: string }> = ({ userId }) => {
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], links: [] });

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await axios.get(`/api/graph/${userId}`);
        setGraphData(res.data);
      } catch (err) {
        console.error('Failed to load knowledge graph:', err);
      }
    };
    fetchGraph();
  }, [userId]);

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <ForceGraph2D
        graphData={graphData}
        nodeAutoColorBy="level"
        nodeLabel={(node: GraphNode) => node.name}
        linkWidth={(link: GraphLink) => link.weight || 1}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
      />
    </div>
  );
};

export default KnowledgeGraph;
