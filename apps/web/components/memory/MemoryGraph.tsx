"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { MemoryCategory, MemoryGraphEdge, MemoryGraphNode } from "@/hooks/useMemory";

const nodeColors: Record<string, string> = {
  identity: "#7C3AED",
  relationship: "#2563EB",
  goal: "#16A34A",
  emotional: "#D97706",
  life_event: "#DB2777",
  preference: "#0891B2",
  habit: "#0F766E",
  user: "#111827"
};

type SimulationNode = MemoryGraphNode & d3.SimulationNodeDatum;

type SimulationLink = d3.SimulationLinkDatum<SimulationNode> & {
  type: string;
  weight: number;
};

type MemoryGraphProps = {
  nodes: MemoryGraphNode[];
  edges: MemoryGraphEdge[];
  categoryFilter: MemoryCategory | "all";
  onNodeSelect: (node: MemoryGraphNode) => void;
};

function nodeRadius(node: MemoryGraphNode): number {
  return node.category === "user" ? 18 : Math.max(9, Math.min(18, 8 + node.importance));
}

export function MemoryGraph({ nodes, edges, categoryFilter, onNodeSelect }: MemoryGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const svgElement = svgRef.current;

    if (!container || !svgElement) {
      return;
    }

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 480);
    const visibleNodes = nodes.filter(
      (node) => node.category === "user" || categoryFilter === "all" || node.category === categoryFilter
    );
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const simulationNodes: SimulationNode[] = visibleNodes.map((node) => ({ ...node }));
    const nodeById = new Map(simulationNodes.map((node) => [node.id, node]));
    const simulationLinks: SimulationLink[] = edges
      .filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
      .map((edge) => ({
        ...edge,
        source: nodeById.get(edge.source) ?? edge.source,
        target: nodeById.get(edge.target) ?? edge.target
      }));

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("role", "img");

    const zoomLayer = svg.append("g");
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.65, 2.4])
        .on("zoom", (event) => {
          zoomLayer.attr("transform", event.transform.toString());
        })
    );

    const link = zoomLayer
      .append("g")
      .attr("stroke", "#CBD5E1")
      .attr("stroke-opacity", 0.8)
      .selectAll<SVGLineElement, SimulationLink>("line")
      .data(simulationLinks)
      .join("line")
      .attr("stroke-width", (edge) => Math.max(1, edge.weight * 1.5));

    const node = zoomLayer
      .append("g")
      .selectAll<SVGGElement, SimulationNode>("g")
      .data(simulationNodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (_event, datum) => onNodeSelect(datum));

    node
      .append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (datum) => nodeColors[datum.category] ?? "#64748B")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 2.5);

    node
      .append("text")
      .text((datum) => datum.label)
      .attr("x", 14)
      .attr("y", 4)
      .attr("font-size", 12)
      .attr("font-weight", 600)
      .attr("fill", "#334155")
      .clone(true)
      .lower()
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round");

    node.call(
      d3
        .drag<SVGGElement, SimulationNode>()
        .on("start", (event, datum) => {
          if (!event.active) {
            simulation.alphaTarget(0.25).restart();
          }
          datum.fx = datum.x;
          datum.fy = datum.y;
        })
        .on("drag", (event, datum) => {
          datum.fx = event.x;
          datum.fy = event.y;
        })
        .on("end", (event, datum) => {
          if (!event.active) {
            simulation.alphaTarget(0);
          }
          datum.fx = null;
          datum.fy = null;
        })
    );

    const simulation = d3
      .forceSimulation(simulationNodes)
      .force(
        "link",
        d3
          .forceLink<SimulationNode, SimulationLink>(simulationLinks)
          .id((datum) => datum.id)
          .distance((edge) => (edge.type === "HAS_MEMORY" ? 96 : 72))
      )
      .force("charge", d3.forceManyBody().strength(-430))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimulationNode>().radius((datum) => nodeRadius(datum) + 22))
      .on("tick", () => {
        link
          .attr("x1", (datum) => (datum.source as SimulationNode).x ?? 0)
          .attr("y1", (datum) => (datum.source as SimulationNode).y ?? 0)
          .attr("x2", (datum) => (datum.target as SimulationNode).x ?? 0)
          .attr("y2", (datum) => (datum.target as SimulationNode).y ?? 0);

        node.attr("transform", (datum) => `translate(${datum.x ?? 0},${datum.y ?? 0})`);
      });

    return () => {
      simulation.stop();
      svg.on(".zoom", null);
    };
  }, [categoryFilter, edges, nodes, onNodeSelect]);

  return (
    <div ref={containerRef} className="h-[560px] min-h-[480px] w-full rounded border border-[hsl(var(--border))] bg-white">
      <svg ref={svgRef} className="h-full w-full" />
    </div>
  );
}
