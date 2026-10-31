/** [icon key in ICONS, x, y, z, scale, rotationY] — floating tiles in the WebGL "universe" scene */
export type ToolTile = [string, number, number, number, number, number];

export const TOOL_TILES: ToolTile[] = [
  ['siFigma', -4.7, 0.5, 1.0, 1.9, 0.4],
  ['siReact', 4.5, 1.7, 0.6, 1.3, -0.4],
  ['siFlutter', -6.9, 2.4, -0.8, 1.0, 0.4],
  ['siJavascript', -3.6, -1.9, 1.4, 1.1, 0.35],
  ['siHtml5', 6.7, 2.5, -1.0, 1.0, -0.4],
  ['siNodedotjs', 2.6, 0.9, -1.2, 0.9, -0.3],
  ['siPython', -7.0, -1.2, -0.2, 1.1, 0.45],
  ['siFlask', 6.9, -0.6, -0.4, 1.05, -0.45],
  ['siPhp', -5.4, -2.3, 0.2, 1.0, 0.4],
  ['siMysql', 4.0, -2.0, 1.2, 1.2, -0.4],
  ['siGit', -2.6, 0.9, -1.2, 0.9, 0.3],
  ['siGithub', 1.5, -2.6, 1.6, 0.85, -0.15],
];