import type { GraphData, GraphNode } from '../services/graph-data-service';

interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimEdge {
  source: SimNode | string;
  target: SimNode | string;
  type: string;
}

export interface GraphRendererOptions {
  container: HTMLElement;
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  maxNodes?: number;
}

export async function renderGraph(options: GraphRendererOptions): Promise<void> {
  const { container, data, onNodeClick, maxNodes = 500 } = options;

  const d3Force = await import('d3-force');
  const d3Selection = await import('d3-selection');
  const d3Zoom = await import('d3-zoom');

  container.innerHTML = '';

  const width = container.clientWidth || 900;
  const height = container.clientHeight || 600;

  // Limit nodes for performance
  let nodes: SimNode[] = data.nodes.slice(0, maxNodes).map(n => ({ ...n }));
  const nodeIds = new Set(nodes.map(n => n.id));
  let edges: SimEdge[] = data.edges
    .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map(e => ({ ...e }));

  const svg = d3Selection.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class', 'graph-svg');

  const g = svg.append('g').attr('class', 'graph-group');

  // Zoom behavior
  const zoom = d3Zoom.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Color scale by node type
  const colorMap: Record<string, string> = {
    root: 'var(--graph-color-root, #e91e63)',
    padyamType: 'var(--graph-color-padyam-type, #9c27b0)',
    padyamSubType: 'var(--graph-color-sub-type, #2196f3)',
    chandamName: 'var(--graph-color-chandam, #4caf50)',
    rule: 'var(--graph-color-rule, #ff9800)',
  };

  // Size scale by node type
  const sizeMap: Record<string, number> = {
    root: 20,
    padyamType: 14,
    padyamSubType: 10,
    chandamName: 7,
    rule: 5,
  };

  // Force simulation
  const simulation = d3Force.forceSimulation<SimNode>(nodes)
    .force('link', d3Force.forceLink<SimNode, SimEdge>(edges)
      .id((d) => d.id)
      .distance(d => {
        const target = d.target as SimNode;
        if (target.type === 'padyamType') return 150;
        if (target.type === 'padyamSubType') return 100;
        if (target.type === 'chandamName') return 70;
        return 50;
      })
    )
    .force('charge', d3Force.forceManyBody().strength(d => {
      const node = d as SimNode;
      if (node.type === 'root') return -500;
      if (node.type === 'padyamType') return -300;
      if (node.type === 'padyamSubType') return -150;
      return -50;
    }))
    .force('center', d3Force.forceCenter(width / 2, height / 2))
    .force('collision', d3Force.forceCollide<SimNode>().radius(d => sizeMap[d.type] + 3));

  // Draw edges
  const link = g.append('g')
    .attr('class', 'graph-links')
    .selectAll('line')
    .data(edges)
    .enter()
    .append('line')
    .attr('class', 'graph-link');

  // Draw nodes
  const node = g.append('g')
    .attr('class', 'graph-nodes')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', d => `graph-node graph-node-${d.type}`)
    .style('cursor', d => d.type === 'rule' ? 'pointer' : 'default')
    .on('click', (_event, d) => {
      if (onNodeClick) onNodeClick(d);
    });

  node.append('circle')
    .attr('r', d => sizeMap[d.type])
    .attr('fill', d => colorMap[d.type]);

  // Labels for non-rule nodes (rules are too many)
  node.filter(d => d.type !== 'rule')
    .append('text')
    .attr('class', 'graph-label')
    .attr('dy', d => -(sizeMap[d.type] + 4))
    .attr('text-anchor', 'middle')
    .text(d => d.label);

  // Tooltip for rule nodes
  node.filter(d => d.type === 'rule')
    .append('title')
    .text(d => d.label);

  // Drag behavior
  let dragTarget: SimNode | null = null;

  node.on('mousedown', (event, d) => {
    if (d.type === 'root') return;
    dragTarget = d;
    d.fx = d.x;
    d.fy = d.y;
    simulation.alphaTarget(0.3).restart();
    event.stopPropagation();
  });

  svg.on('mousemove', (event) => {
    if (!dragTarget) return;
    const [x, y] = d3Selection.pointer(event, g.node()!);
    dragTarget.fx = x;
    dragTarget.fy = y;
  });

  svg.on('mouseup', () => {
    if (!dragTarget) return;
    dragTarget.fx = null;
    dragTarget.fy = null;
    dragTarget = null;
    simulation.alphaTarget(0);
  });

  // Tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => (d.source as SimNode).x!)
      .attr('y1', d => (d.source as SimNode).y!)
      .attr('x2', d => (d.target as SimNode).x!)
      .attr('y2', d => (d.target as SimNode).y!);

    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Legend
  const legendData = [
    { type: 'root', label: 'Root' },
    { type: 'padyamType', label: 'Padyam Type' },
    { type: 'padyamSubType', label: 'Sub Type' },
    { type: 'chandamName', label: 'Chandam Name' },
    { type: 'rule', label: 'Rule' },
  ];

  const legend = svg.append('g')
    .attr('class', 'graph-legend')
    .attr('transform', 'translate(20, 20)');

  legendData.forEach((item, i) => {
    const row = legend.append('g').attr('transform', `translate(0, ${i * 22})`);
    row.append('circle')
      .attr('r', 6)
      .attr('cx', 6)
      .attr('cy', 0)
      .attr('fill', colorMap[item.type]);
    row.append('text')
      .attr('x', 18)
      .attr('y', 4)
      .attr('class', 'graph-legend-text')
      .text(item.label);
  });

  // Node count info
  if (data.nodes.length > maxNodes) {
    svg.append('text')
      .attr('x', width - 10)
      .attr('y', height - 10)
      .attr('text-anchor', 'end')
      .attr('class', 'graph-info-text')
      .text(`Showing ${maxNodes} of ${data.nodes.length} nodes`);
  }
}
