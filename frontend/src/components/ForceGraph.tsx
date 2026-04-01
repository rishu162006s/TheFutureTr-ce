"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { GraphNode, GraphEdge, DOMAIN_COLORS } from "@/lib/api";

interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  seedNodeId: string | null;
  highlightedPath?: string[];
  onNodeClick: (nodeId: string) => void;
  height?: number;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pinned: boolean;
}

export default function ForceGraph({
  nodes,
  edges,
  seedNodeId,
  highlightedPath = [],
  onNodeClick,
  height = 520,
}: ForceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const simNodesRef = useRef<SimNode[]>([]);
  const animFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  const simNodes = useMemo(() => {
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const nonSeed = nodes.filter((n) => n.id !== seedNodeId);

    return nodes.map((node) => {
      const isSeed = node.id === seedNodeId;
      let x = cx;
      let y = cy;

      if (!isSeed) {
        const idx = nonSeed.findIndex((n) => n.id === node.id);
        const total = nonSeed.length || 1;
        const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
        const r = 170 + (Math.random() - 0.5) * 30;
        x = cx + Math.cos(angle) * r;
        y = cy + Math.sin(angle) * r;
      }

      const color = DOMAIN_COLORS[node.domain] || "#6b7280";
      const radius = isSeed ? 22 : 8 + (node.signal_strength || 0.3) * 14;

      return { ...node, x, y, vx: 0, vy: 0, radius, color, pinned: isSeed } as SimNode;
    });
  }, [nodes, dimensions, seedNodeId]);

  useEffect(() => {
    simNodesRef.current = [...simNodes];
  }, [simNodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    let running = true;
    let alpha = 1.0;
    let frameCount = 0;

    const tick = () => {
      if (!running) return;
      frameCount++;
      alpha = Math.max(0.001, alpha * 0.994);
      const sn = simNodesRef.current;

      // Physics
      for (let i = 0; i < sn.length; i++) {
        if (sn[i].pinned) { sn[i].x = cx; sn[i].y = cy; continue; }

        // Gravity toward center
        sn[i].vx += (cx - sn[i].x) * 0.0006 * alpha;
        sn[i].vy += (cy - sn[i].y) * 0.0006 * alpha;

        // Node repulsion
        for (let j = i + 1; j < sn.length; j++) {
          const dx = sn[j].x - sn[i].x;
          const dy = sn[j].y - sn[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = sn[i].radius + sn[j].radius + 50;
          if (dist < minDist) {
            const f = ((minDist - dist) / minDist) * 0.6;
            const fx = (dx / dist) * f;
            const fy = (dy / dist) * f;
            sn[i].vx -= fx; sn[i].vy -= fy;
            sn[j].vx += fx; sn[j].vy += fy;
          }
        }
      }

      // Edge springs
      for (const edge of edges) {
        const src = sn.find((n) => n.id === edge.source);
        const tgt = sn.find((n) => n.id === edge.target);
        if (!src || !tgt) continue;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ideal = 190;
        const f = (dist - ideal) * 0.004 * alpha;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        if (!src.pinned) { src.vx += fx; src.vy += fy; }
        if (!tgt.pinned) { tgt.vx -= fx; tgt.vy -= fy; }
      }

      for (const node of sn) {
        if (node.pinned) continue;
        node.vx *= 0.78;
        node.vy *= 0.78;
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(node.radius + 16, Math.min(dimensions.width - node.radius - 16, node.x));
        node.y = Math.max(node.radius + 16, Math.min(dimensions.height - node.radius - 16, node.y));
      }

      // ── Render ──
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Subtle center glow
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
      bg.addColorStop(0, "rgba(59,130,246,0.05)");
      bg.addColorStop(1, "transparent");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Edges
      for (const edge of edges) {
        const src = sn.find((n) => n.id === edge.source);
        const tgt = sn.find((n) => n.id === edge.target);
        if (!src || !tgt) continue;

        const hov = hoveredNode === edge.source || hoveredNode === edge.target;
        const inPath =
          highlightedPath.includes(edge.source) &&
          highlightedPath.includes(edge.target);

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = inPath
          ? "rgba(16,185,129,0.75)"
          : hov
          ? `rgba(59,130,246,${0.35 + edge.weight * 0.45})`
          : `rgba(148,163,184,${0.05 + edge.weight * 0.1})`;
        ctx.lineWidth = inPath ? 2.5 : hov ? edge.weight * 2.5 : 1.2;
        ctx.stroke();

        // Edge label on hover
        if (hov && edge.relationship) {
          const mx = (src.x + tgt.x) / 2;
          const my = (src.y + tgt.y) / 2;
          const label = edge.relationship.replace(/_/g, " ");
          ctx.font = "10px Inter, sans-serif";
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = "rgba(15,23,42,0.9)";
          ctx.beginPath();
          (ctx as any).roundRect?.(mx - tw / 2 - 5, my - 9, tw + 10, 18, 5) ||
            ctx.rect(mx - tw / 2 - 5, my - 9, tw + 10, 18);
          ctx.fill();
          ctx.fillStyle = "#94a3b8";
          ctx.textAlign = "center";
          ctx.fillText(label, mx, my + 3.5);
        }
      }

      // Nodes
      for (const node of sn) {
        const isSeed = node.pinned;
        const isHov = hoveredNode === node.id;
        const isConn =
          hoveredNode != null &&
          edges.some(
            (e) =>
              (e.source === hoveredNode && e.target === node.id) ||
              (e.target === hoveredNode && e.source === node.id)
          );
        const inPath = highlightedPath.includes(node.id);
        const highlight = isSeed || isHov || isConn || inPath;

        // Outer glow
        if (highlight) {
          const gr = ctx.createRadialGradient(
            node.x, node.y, node.radius,
            node.x, node.y, node.radius + 14
          );
          gr.addColorStop(0, `${node.color}35`);
          gr.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 14, 0, Math.PI * 2);
          ctx.fillStyle = gr;
          ctx.fill();
        }

        // Node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = highlight ? node.color : `${node.color}88`;
        ctx.fill();

        // Border
        if (isSeed) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (isHov) {
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Pulsing ring for seed
        if (isSeed) {
          const pulse = node.radius + 8 + Math.sin(frameCount * 0.05) * 5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}38`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        if (isSeed || isHov || isConn || node.radius > 14) {
          ctx.fillStyle = isSeed ? "#ffffff" : isHov ? "#f1f5f9" : "#94a3b8";
          ctx.font = `${isSeed ? "700" : isHov ? "600" : "500"} ${
            isSeed ? 13 : 11
          }px Inter, sans-serif`;
          ctx.textAlign = "center";
          const lbl =
            node.label.length > 20 ? node.label.slice(0, 19) + "…" : node.label;
          ctx.fillText(lbl, node.x, node.y + node.radius + 17);
        }

        // Hover tooltip
        if (isHov) {
          const tipX = Math.min(node.x + node.radius + 14, dimensions.width - 170);
          const tipY = Math.max(node.y - 40, 8);
          const relevance = node.metadata?.relevance
            ? `Relevance: ${(node.metadata.relevance * 100).toFixed(0)}%`
            : null;
          const depth = node.metadata?.depth != null
            ? `Depth: ${node.metadata.depth}`
            : null;
          const signal = `Signal: ${(node.signal_strength * 100).toFixed(0)}%`;
          const lines = [node.label, node.domain, signal, relevance, depth].filter(
            Boolean
          ) as string[];
          const lh = 17;
          const tw = 165;
          const th = lines.length * lh + 16;
          ctx.fillStyle = "rgba(11,17,32,0.96)";
          ctx.beginPath();
          (ctx as any).roundRect?.(tipX, tipY, tw, th, 8) ||
            ctx.rect(tipX, tipY, tw, th);
          ctx.fill();
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 1;
          ctx.stroke();
          lines.forEach((line, li) => {
            ctx.font =
              li === 0
                ? "600 11px Inter, sans-serif"
                : "10px Inter, sans-serif";
            ctx.fillStyle = li === 0 ? "#f1f5f9" : "#64748b";
            ctx.textAlign = "left";
            ctx.fillText(line, tipX + 10, tipY + 15 + li * lh);
          });
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [dimensions, edges, hoveredNode, highlightedPath]);

  const toCanvas = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (dimensions.width / rect.width),
        y: (e.clientY - rect.top) * (dimensions.height / rect.height),
      };
    },
    [dimensions]
  );

  const getNodeAt = useCallback(
    (mx: number, my: number) => {
      for (const node of simNodesRef.current) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (dx * dx + dy * dy < (node.radius + 8) * (node.radius + 8))
          return node;
      }
      return null;
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = toCanvas(e);
      const node = getNodeAt(x, y);
      setHoveredNode(node?.id ?? null);
      if (canvasRef.current)
        canvasRef.current.style.cursor = node ? "pointer" : "default";
    },
    [toCanvas, getNodeAt]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = toCanvas(e);
      const node = getNodeAt(x, y);
      if (node) onNodeClick(node.id);
    },
    [toCanvas, getNodeAt, onNodeClick]
  );

  return (
    <div ref={containerRef} style={{ height, position: "relative", width: "100%" }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ width: "100%", height: "100%", borderRadius: "var(--border-radius)" }}
      />
      {nodes.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            gap: 12,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 52, opacity: 0.2 }}>🕳️</div>
          <div style={{ fontSize: 14, opacity: 0.5 }}>
            Select a technology above to explore
          </div>
        </div>
      )}
      {/* Domain legend */}
      {nodes.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            display: "flex",
            gap: 10,
            padding: "5px 10px",
            background: "rgba(15,23,42,0.8)",
            borderRadius: 8,
            fontSize: 10,
            flexWrap: "wrap",
            maxWidth: 400,
          }}
        >
          {Array.from(new Set(nodes.map((n) => n.domain)))
            .filter(Boolean)
            .map((domain) => (
              <div
                key={domain}
                style={{ display: "flex", alignItems: "center", gap: 4, color: "#94a3b8" }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: DOMAIN_COLORS[domain] || "#6b7280",
                  }}
                />
                {domain.replace("Artificial Intelligence", "AI")}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
