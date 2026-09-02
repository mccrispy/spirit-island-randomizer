import { useState } from "react";
import type { BoardLayout } from "../data/types";

const LAYOUT_ASSET_BASE = `${import.meta.env.BASE_URL}assets/layouts`;
const PLACEHOLDER_ASSET = `${LAYOUT_ASSET_BASE}/Wild.png`;

export interface LayoutDisplayProps {
  layout: BoardLayout | null;
  totalBoards: number;
  useThematicBoards: boolean;
  // PRM parity: pre-generation "Random" preview shows the Wild.png placeholder instead of nothing.
  showPlaceholderWhenNoLayout?: boolean;
}

// PRM parity: ported from ui/main_window.py's _update_layout_svg/_load_svg_for_layout asset resolution.
export function resolveLayoutAssetPath({
  layout,
  totalBoards,
  useThematicBoards,
  showPlaceholderWhenNoLayout,
}: LayoutDisplayProps): { path: string; alt: string } | null {
  if (useThematicBoards) {
    return {
      path: `${LAYOUT_ASSET_BASE}/${totalBoards}-thematic.svg`,
      alt: "Thematic board layout",
    };
  }
  if (!layout) {
    if (showPlaceholderWhenNoLayout) {
      return {
        path: PLACEHOLDER_ASSET,
        alt: "Random layout — resolved after Generate",
      };
    }
    return null;
  }
  if (!layout.svgFile) {
    return { path: PLACEHOLDER_ASSET, alt: "Player-defined arrangement" };
  }
  return {
    path: `${LAYOUT_ASSET_BASE}/${totalBoards}-${layout.svgFile}.svg`,
    alt: `${layout.name} layout`,
  };
}

export function LayoutDisplay(props: LayoutDisplayProps) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const resolved = resolveLayoutAssetPath(props);

  if (!resolved || resolved.path === failedPath) {
    return null;
  }

  return (
    <img
      className="layout-diagram"
      src={resolved.path}
      alt={resolved.alt}
      onError={() => setFailedPath(resolved.path)}
    />
  );
}
