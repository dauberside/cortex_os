"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

// SSRを無効化してクライアントサイドのみで読み込む
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-lg border bg-white">
      <p className="text-gray-500">グラフを読み込み中...</p>
    </div>
  ),
});

interface GraphNode {
  id: string;
  title: string;
  content: string;
  tags: { id: string; name: string }[];
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: string | null;
}

interface GraphViewProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (node: GraphNode) => void;
}

export function GraphView({ nodes, links, onNodeClick }: GraphViewProps) {
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // ウィンドウサイズに合わせてグラフサイズを調整
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth - 100,
        height: window.innerHeight - 200,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // タグに基づいてノードの色を決定
  const getNodeColor = (node: GraphNode) => {
    if (selectedNode?.id === node.id) {
      return "#3b82f6"; // 選択中のノードは青
    }
    if (node.tags.length === 0) {
      return "#9ca3af"; // タグなしはグレー
    }
    // タグの最初の文字のハッシュ値から色を生成
    const tagName = node.tags[0].name;
    const hash = tagName.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  // ノードのサイズを決定（リンク数に基づく）
  const getNodeSize = (node: GraphNode) => {
    const linkCount = links.filter(
      (link) => link.source === node.id || link.target === node.id
    ).length;
    return 3 + linkCount * 1.5;
  };

  const handleNodeClick = useCallback(
    (node: any) => {
      setSelectedNode(node);
      if (onNodeClick) {
        onNodeClick(node as GraphNode);
      }
    },
    [onNodeClick]
  );

  const handleZoomToFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };

  const handleCenterGraph = () => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 1000);
      graphRef.current.zoom(1, 1000);
    }
  };

  return (
    <div className="relative">
      {/* コントロールボタン */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button size="sm" variant="outline" onClick={handleZoomToFit}>
          全体表示
        </Button>
        <Button size="sm" variant="outline" onClick={handleCenterGraph}>
          中央に戻す
        </Button>
      </div>

      {/* 選択中のノード情報 */}
      {selectedNode && (
        <div className="absolute top-4 left-4 z-10 max-w-xs rounded-lg bg-white p-4 shadow-lg">
          <h3 className="mb-2 text-lg font-semibold text-black">
            {selectedNode.title}
          </h3>
          <p className="mb-2 line-clamp-3 text-sm text-gray-700">
            {selectedNode.content}
          </p>
          {selectedNode.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedNode.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded bg-gray-200 px-2 py-0.5 text-xs text-black"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedNode(null)}
            className="mt-2 w-full"
          >
            閉じる
          </Button>
        </div>
      )}

      {/* グラフ */}
      <div className="rounded-lg border bg-white">
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={{ nodes, links }}
          nodeLabel={(node: any) => node.title}
          nodeColor={(node: any) => getNodeColor(node)}
          nodeVal={(node: any) => getNodeSize(node)}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.title;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(
              (n) => n + fontSize * 0.2
            );

            // ノードの円を描画
            ctx.fillStyle = getNodeColor(node);
            ctx.beginPath();
            ctx.arc(node.x, node.y, getNodeSize(node), 0, 2 * Math.PI, false);
            ctx.fill();

            // ラベルの背景
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(
              node.x - bckgDimensions[0] / 2,
              node.y + getNodeSize(node) + 2,
              bckgDimensions[0],
              bckgDimensions[1]
            );

            // ラベルのテキスト
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "black";
            ctx.fillText(
              label,
              node.x,
              node.y + getNodeSize(node) + 2 + bckgDimensions[1] / 2
            );
          }}
          linkColor={() => "#cbd5e1"}
          linkWidth={1.5}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          onNodeClick={handleNodeClick}
          cooldownTicks={100}
          onEngineStop={() => {
            if (graphRef.current) {
              graphRef.current.zoomToFit(400);
            }
          }}
        />
      </div>

      {/* 凡例 */}
      <div className="mt-4 rounded-lg bg-white p-4 shadow">
        <h4 className="mb-2 text-sm font-semibold text-black">凡例</h4>
        <div className="flex flex-wrap gap-4 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span>選択中のノート</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-400"></div>
            <span>タグなし</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500"></div>
            <span>タグあり（色はタグで変化）</span>
          </div>
          <div className="flex items-center gap-2">
            <span>ノードサイズ = リンク数</span>
          </div>
        </div>
      </div>
    </div>
  );
}
