/**
 * Core Domino Pure Logic
 * Decoupled from UI, 100% deterministic and unit-testable
 */

import {
  DominoTile,
  PlacedTile,
  GameMode,
  AIDifficulty,
  PlayerState,
  PlacementDirection,
  CandidatePlacement,
} from '../types/domino';

/**
 * Standard Double-Six Domino Set (28 tiles, 0-0 through 6-6)
 */
export function createDoubleSixSet(): DominoTile[] {
  const set: DominoTile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      set.push({
        id: `${i}-${j}`,
        left: i,
        right: j,
      });
    }
  }
  return set;
}

/**
 * Fisher-Yates array shuffle using an optional PRNG or Math.random
 */
export function shuffleTiles(tiles: DominoTile[], randomFn: () => number = Math.random): DominoTile[] {
  const copy = [...tiles];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Total pip count for a single domino tile
 */
export function getTilePips(tile: DominoTile): number {
  return tile.left + tile.right;
}

/**
 * Sum of pips in a player's hand
 */
export function sumHandPips(hand: DominoTile[]): number {
  return hand.reduce((acc, t) => acc + getTilePips(t), 0);
}

/**
 * Checks which ends a tile can legally connect to on the board.
 * If board is empty (leftEnd === null and rightEnd === null), any tile is playable on both ends.
 */
export function canPlayTile(
  tile: DominoTile,
  leftEnd: number | null,
  rightEnd: number | null
): { canLeft: boolean; canRight: boolean } {
  if (leftEnd === null || rightEnd === null) {
    return { canLeft: true, canRight: true };
  }

  const canLeft = tile.left === leftEnd || tile.right === leftEnd;
  const canRight = tile.left === rightEnd || tile.right === rightEnd;

  return { canLeft, canRight };
}

/**
 * Returns all playable tiles from hand with their possible target ends
 */
export function getPlayableMoves(
  hand: DominoTile[],
  leftEnd: number | null,
  rightEnd: number | null
): Array<{ tile: DominoTile; end: 'left' | 'right' }> {
  const moves: Array<{ tile: DominoTile; end: 'left' | 'right' }> = [];
  
  if (leftEnd === null || rightEnd === null) {
    // Empty board - first tile is placed as root
    for (const tile of hand) {
      moves.push({ tile, end: 'left' });
    }
    return moves;
  }

  for (const tile of hand) {
    const { canLeft, canRight } = canPlayTile(tile, leftEnd, rightEnd);
    if (canLeft) {
      moves.push({ tile, end: 'left' });
    }
    // If placing on right is also valid and ends are different, or board only has 1 tile
    if (canRight) {
      // Don't duplicate redundant root moves if board ends are identical
      moves.push({ tile, end: 'right' });
    }
  }

  return moves;
}

export const DIR_VECTORS: Record<PlacementDirection, { dx: number; dy: number }> = {
  right: { dx: 1, dy: 0 },
  left: { dx: -1, dy: 0 },
  down: { dx: 0, dy: 1 },
  up: { dx: 0, dy: -1 },
};

export function getTurnDirections(currentDir: PlacementDirection): {
  straight: PlacementDirection;
  turnCw: PlacementDirection;
  turnCcw: PlacementDirection;
} {
  switch (currentDir) {
    case 'right':
      return { straight: 'right', turnCw: 'down', turnCcw: 'up' };
    case 'down':
      return { straight: 'down', turnCw: 'left', turnCcw: 'right' };
    case 'left':
      return { straight: 'left', turnCw: 'up', turnCcw: 'down' };
    case 'up':
      return { straight: 'up', turnCw: 'right', turnCcw: 'left' };
  }
}

export function getDirectionLabel(dir: PlacementDirection, currentDir: PlacementDirection): string {
  if (dir === currentDir) return '➡️ Straight';
  switch (dir) {
    case 'down':
      return '⬇️ Turn Down';
    case 'up':
      return '⬆️ Turn Up';
    case 'left':
      return '⬅️ Turn Left';
    case 'right':
      return '➡️ Turn Right';
  }
}

export function getOccupiedCells(board: PlacedTile[]): Set<string> {
  const set = new Set<string>();
  for (const t of board) {
    if (t.x1 !== undefined && t.y1 !== undefined) {
      set.add(`${t.x1},${t.y1}`);
    }
    if (t.x2 !== undefined && t.y2 !== undefined) {
      set.add(`${t.x2},${t.y2}`);
    }
  }
  return set;
}

/**
 * Calculates all available non-colliding 2D placement candidates for a tile.
 * Gives user the power to select where and how to place (straight or corner turns).
 */
export function getCandidatePlacements(
  board: PlacedTile[],
  leftEnd: number | null,
  rightEnd: number | null,
  tile: DominoTile
): CandidatePlacement[] {
  const isTileDouble = tile.left === tile.right;

  if (board.length === 0 || leftEnd === null || rightEnd === null) {
    if (isTileDouble) {
      return [
        {
          end: 'left',
          direction: 'down',
          label: 'Salida Vertical',
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          gx: 0,
          gy: 0,
          orientation: 'vertical',
          pip1: tile.left,
          pip2: tile.right,
        },
        {
          end: 'left',
          direction: 'right',
          label: 'Salida Horizontal',
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          gx: 0,
          gy: 0,
          orientation: 'horizontal',
          pip1: tile.left,
          pip2: tile.right,
        },
      ];
    }

    // Piezas mixtas (no dobles): SIEMPRE salida horizontal hacia los lados
    return [
      {
        end: 'left',
        direction: 'right',
        label: 'Salida Horizontal',
        x1: 0,
        y1: 0,
        x2: 1,
        y2: 0,
        gx: 0,
        gy: 0,
        orientation: 'horizontal',
        pip1: tile.left,
        pip2: tile.right,
      },
    ];
  }

  const occupied = getOccupiedCells(board);
  const candidates: CandidatePlacement[] = [];

  // Check Left End
  const canLeft = tile.left === leftEnd || tile.right === leftEnd;
  if (canLeft) {
    const headTile = board[0];
    const isRoot = headTile.placedEnd === 'root';
    const isRootDouble = isRoot && headTile.tile.left === headTile.tile.right;

    let openX: number;
    let openY: number;
    let currentDir: PlacementDirection;

    if (isRoot) {
      if (isRootDouble) {
        openX = 0;
        openY = 0;
        currentDir = headTile.orientation === 'horizontal' ? 'up' : 'left';
      } else {
        openX = headTile.x1 ?? 0;
        openY = headTile.y1 ?? 0;
        currentDir = 'left';
      }
    } else {
      openX = headTile.x2 ?? 0;
      openY = headTile.y2 ?? 0;
      currentDir = headTile.direction ?? 'left';
    }

    const turns = getTurnDirections(currentDir);
    const dirList: PlacementDirection[] = [turns.straight, turns.turnCw, turns.turnCcw];

    const matchedPip = leftEnd;
    const openPip = tile.left === leftEnd ? tile.right : tile.left;

    for (const dir of dirList) {
      const v = DIR_VECTORS[dir];
      const isHorizMove = v.dx !== 0;

      let c1x: number;
      let c1y: number;
      let c2x: number;
      let c2y: number;
      let gx: number;
      let gy: number;
      let orientation: 'horizontal' | 'vertical';

      if (isTileDouble) {
        // Crosswise double advances by only 1 cell along line of play
        c1x = openX + v.dx;
        c1y = openY + v.dy;
        c2x = c1x;
        c2y = c1y;
        gx = c1x;
        gy = c1y;
        orientation = isHorizMove ? 'vertical' : 'horizontal';
      } else {
        // Normal domino advances by 2 cells along line of play
        c1x = openX + v.dx;
        c1y = openY + v.dy;
        c2x = openX + 2 * v.dx;
        c2y = openY + 2 * v.dy;
        gx = Math.min(c1x, c2x);
        gy = Math.min(c1y, c2y);
        orientation = isHorizMove ? 'horizontal' : 'vertical';
      }

      // Check collision
      let isColliding = false;
      if (orientation === 'horizontal') {
        if (occupied.has(`${gx},${gy}`) || occupied.has(`${gx + 1},${gy}`)) {
          isColliding = true;
        }
      } else {
        if (occupied.has(`${gx},${gy}`) || occupied.has(`${gx},${gy + 1}`)) {
          isColliding = true;
        }
      }

      if (!isColliding) {
        let pip1: number;
        let pip2: number;
        if (isTileDouble) {
          pip1 = tile.left;
          pip2 = tile.right;
        } else if (orientation === 'horizontal') {
          pip1 = c1x < c2x ? matchedPip : openPip;
          pip2 = c1x < c2x ? openPip : matchedPip;
        } else {
          pip1 = c1y < c2y ? matchedPip : openPip;
          pip2 = c1y < c2y ? openPip : matchedPip;
        }

        candidates.push({
          end: 'left',
          direction: dir,
          label: getDirectionLabel(dir, currentDir),
          x1: c1x,
          y1: c1y,
          x2: c2x,
          y2: c2y,
          gx,
          gy,
          orientation,
          pip1,
          pip2,
        });
      }
    }
  }

  // Check Right End
  const canRight = tile.left === rightEnd || tile.right === rightEnd;
  if (canRight) {
    const tailTile = board[board.length - 1];
    const isRoot = tailTile.placedEnd === 'root';
    const isRootDouble = isRoot && tailTile.tile.left === tailTile.tile.right;

    let openX: number;
    let openY: number;
    let currentDir: PlacementDirection;

    if (isRoot) {
      if (isRootDouble) {
        openX = 0;
        openY = 0;
        currentDir = tailTile.orientation === 'horizontal' ? 'down' : 'right';
      } else {
        openX = tailTile.x2 ?? 1;
        openY = tailTile.y2 ?? 0;
        currentDir = 'right';
      }
    } else {
      openX = tailTile.x2 ?? 1;
      openY = tailTile.y2 ?? 0;
      currentDir = tailTile.direction ?? 'right';
    }

    const turns = getTurnDirections(currentDir);
    const dirList: PlacementDirection[] = [turns.straight, turns.turnCw, turns.turnCcw];

    const matchedPip = rightEnd;
    const openPip = tile.left === rightEnd ? tile.right : tile.left;

    for (const dir of dirList) {
      const v = DIR_VECTORS[dir];
      const isHorizMove = v.dx !== 0;

      let c1x: number;
      let c1y: number;
      let c2x: number;
      let c2y: number;
      let gx: number;
      let gy: number;
      let orientation: 'horizontal' | 'vertical';

      if (isTileDouble) {
        // Crosswise double advances by only 1 cell along line of play
        c1x = openX + v.dx;
        c1y = openY + v.dy;
        c2x = c1x;
        c2y = c1y;
        gx = c1x;
        gy = c1y;
        orientation = isHorizMove ? 'vertical' : 'horizontal';
      } else {
        // Normal domino advances by 2 cells along line of play
        c1x = openX + v.dx;
        c1y = openY + v.dy;
        c2x = openX + 2 * v.dx;
        c2y = openY + 2 * v.dy;
        gx = Math.min(c1x, c2x);
        gy = Math.min(c1y, c2y);
        orientation = isHorizMove ? 'horizontal' : 'vertical';
      }

      // Check collision
      let isColliding = false;
      if (orientation === 'horizontal') {
        if (occupied.has(`${gx},${gy}`) || occupied.has(`${gx + 1},${gy}`)) {
          isColliding = true;
        }
      } else {
        if (occupied.has(`${gx},${gy}`) || occupied.has(`${gx},${gy + 1}`)) {
          isColliding = true;
        }
      }

      if (!isColliding) {
        let pip1: number;
        let pip2: number;
        if (isTileDouble) {
          pip1 = tile.left;
          pip2 = tile.right;
        } else if (orientation === 'horizontal') {
          pip1 = c1x < c2x ? matchedPip : openPip;
          pip2 = c1x < c2x ? openPip : matchedPip;
        } else {
          pip1 = c1y < c2y ? matchedPip : openPip;
          pip2 = c1y < c2y ? openPip : matchedPip;
        }

        candidates.push({
          end: 'right',
          direction: dir,
          label: getDirectionLabel(dir, currentDir),
          x1: c1x,
          y1: c1y,
          x2: c2x,
          y2: c2y,
          gx,
          gy,
          orientation,
          pip1,
          pip2,
        });
      }
    }
  }

  return candidates;
}

/**
 * Applies a move to the board, returning the updated board and new left/right ends.
 * Supports choosing 2D placement direction ('right', 'left', 'up', 'down') or auto-snaking.
 */
export function applyMove(
  board: PlacedTile[],
  currentLeftEnd: number | null,
  currentRightEnd: number | null,
  tile: DominoTile,
  end: 'left' | 'right',
  chosenDirection?: PlacementDirection
): {
  board: PlacedTile[];
  newLeftEnd: number;
  newRightEnd: number;
  newPlacedTile: PlacedTile;
} {
  const isTileDouble = tile.left === tile.right;

  // Empty board placement
  if (board.length === 0 || currentLeftEnd === null || currentRightEnd === null) {
    let orientation: 'horizontal' | 'vertical';
    let dir: PlacementDirection;
    let x2: number;
    let y2: number;

    if (isTileDouble) {
      // Salida vertical uses 'down', horizontal uses 'right'
      const isVert = chosenDirection === 'down' || chosenDirection === 'up' || (chosenDirection === undefined);
      orientation = isVert ? 'vertical' : 'horizontal';
      dir = isVert ? 'right' : 'down';
      x2 = 0;
      y2 = 0;
    } else {
      // Mixed piece is ALWAYS horizontal, plays to the sides (left/right)
      orientation = 'horizontal';
      dir = 'right';
      x2 = 1;
      y2 = 0;
    }

    const placed: PlacedTile = {
      tile,
      placedEnd: 'root',
      orientation,
      matchedPip: tile.left,
      openPip: tile.right,
      boardIndex: 0,
      displayLeft: tile.left,
      displayRight: tile.right,
      x1: 0,
      y1: 0,
      x2,
      y2,
      direction: dir,
    };
    return {
      board: [placed],
      newLeftEnd: tile.left,
      newRightEnd: tile.right,
      newPlacedTile: placed,
    };
  }

  const occupied = getOccupiedCells(board);

  if (end === 'left') {
    // Connect to currentLeftEnd
    let matchedPip: number;
    let openPip: number;

    if (tile.right === currentLeftEnd) {
      matchedPip = tile.right;
      openPip = tile.left;
    } else if (tile.left === currentLeftEnd) {
      matchedPip = tile.left;
      openPip = tile.right;
    } else {
      // Fallback tolerance
      matchedPip = currentLeftEnd;
      openPip = tile.left === currentLeftEnd ? tile.right : tile.left;
    }

    const headTile = board[0];
    const isRoot = headTile.placedEnd === 'root';
    const isRootDouble = isRoot && headTile.tile.left === headTile.tile.right;

    let openX: number;
    let openY: number;
    let baseDir: PlacementDirection;

    if (isRoot) {
      if (isRootDouble) {
        openX = 0;
        openY = 0;
        baseDir = headTile.orientation === 'horizontal' ? 'up' : 'left';
      } else {
        openX = headTile.x1 ?? 0;
        openY = headTile.y1 ?? 0;
        baseDir = 'left';
      }
    } else {
      openX = headTile.x2 ?? 0;
      openY = headTile.y2 ?? 0;
      baseDir = headTile.direction ?? 'left';
    }

    const turns = getTurnDirections(baseDir);
    const validDirs: PlacementDirection[] = [];

    for (const d of [turns.straight, turns.turnCw, turns.turnCcw]) {
      const v = DIR_VECTORS[d];
      const isHoriz = v.dx !== 0;
      let checkGx: number;
      let checkGy: number;
      let checkOrientation: 'horizontal' | 'vertical';

      if (isTileDouble) {
        checkGx = openX + v.dx;
        checkGy = openY + v.dy;
        checkOrientation = isHoriz ? 'vertical' : 'horizontal';
      } else {
        checkGx = Math.min(openX + v.dx, openX + 2 * v.dx);
        checkGy = Math.min(openY + v.dy, openY + 2 * v.dy);
        checkOrientation = isHoriz ? 'horizontal' : 'vertical';
      }

      let collides = false;
      if (checkOrientation === 'horizontal') {
        if (occupied.has(`${checkGx},${checkGy}`) || occupied.has(`${checkGx + 1},${checkGy}`)) collides = true;
      } else {
        if (occupied.has(`${checkGx},${checkGy}`) || occupied.has(`${checkGx},${checkGy + 1}`)) collides = true;
      }
      if (!collides) {
        validDirs.push(d);
      }
    }

    let dir: PlacementDirection;
    if (chosenDirection && validDirs.includes(chosenDirection)) {
      dir = chosenDirection;
    } else if (validDirs.includes(turns.straight)) {
      dir = turns.straight;
    } else if (validDirs.length > 0) {
      dir = validDirs[0];
    } else {
      dir = turns.straight;
    }

    const v = DIR_VECTORS[dir];
    const isHoriz = v.dx !== 0;

    let c1x: number;
    let c1y: number;
    let c2x: number;
    let c2y: number;
    let orientation: 'horizontal' | 'vertical';
    let displayLeft: number;
    let displayRight: number;

    if (isTileDouble) {
      c1x = openX + v.dx;
      c1y = openY + v.dy;
      c2x = c1x;
      c2y = c1y;
      orientation = isHoriz ? 'vertical' : 'horizontal';
      displayLeft = tile.left;
      displayRight = tile.right;
    } else {
      c1x = openX + v.dx;
      c1y = openY + v.dy;
      c2x = openX + 2 * v.dx;
      c2y = openY + 2 * v.dy;
      orientation = isHoriz ? 'horizontal' : 'vertical';
      if (orientation === 'horizontal') {
        displayLeft = c1x < c2x ? matchedPip : openPip;
        displayRight = c1x < c2x ? openPip : matchedPip;
      } else {
        displayLeft = c1y < c2y ? matchedPip : openPip;
        displayRight = c1y < c2y ? openPip : matchedPip;
      }
    }

    const placed: PlacedTile = {
      tile,
      placedEnd: 'left',
      orientation,
      matchedPip,
      openPip,
      boardIndex: board.length,
      displayLeft,
      displayRight,
      x1: c1x,
      y1: c1y,
      x2: c2x,
      y2: c2y,
      direction: dir,
    };

    return {
      board: [placed, ...board],
      newLeftEnd: openPip,
      newRightEnd: currentRightEnd,
      newPlacedTile: placed,
    };
  } else {
    // Connect to currentRightEnd
    let matchedPip: number;
    let openPip: number;

    if (tile.left === currentRightEnd) {
      matchedPip = tile.left;
      openPip = tile.right;
    } else if (tile.right === currentRightEnd) {
      matchedPip = tile.right;
      openPip = tile.left;
    } else {
      matchedPip = currentRightEnd;
      openPip = tile.left === currentRightEnd ? tile.right : tile.left;
    }

    const tailTile = board[board.length - 1];
    const isRoot = tailTile.placedEnd === 'root';
    const isRootDouble = isRoot && tailTile.tile.left === tailTile.tile.right;

    let openX: number;
    let openY: number;
    let baseDir: PlacementDirection;

    if (isRoot) {
      if (isRootDouble) {
        openX = 0;
        openY = 0;
        baseDir = tailTile.orientation === 'horizontal' ? 'down' : 'right';
      } else {
        openX = tailTile.x2 ?? 1;
        openY = tailTile.y2 ?? 0;
        baseDir = 'right';
      }
    } else {
      openX = tailTile.x2 ?? 1;
      openY = tailTile.y2 ?? 0;
      baseDir = tailTile.direction ?? 'right';
    }

    const turns = getTurnDirections(baseDir);
    const validDirs: PlacementDirection[] = [];

    for (const d of [turns.straight, turns.turnCw, turns.turnCcw]) {
      const v = DIR_VECTORS[d];
      const isHoriz = v.dx !== 0;
      let checkGx: number;
      let checkGy: number;
      let checkOrientation: 'horizontal' | 'vertical';

      if (isTileDouble) {
        checkGx = openX + v.dx;
        checkGy = openY + v.dy;
        checkOrientation = isHoriz ? 'vertical' : 'horizontal';
      } else {
        checkGx = Math.min(openX + v.dx, openX + 2 * v.dx);
        checkGy = Math.min(openY + v.dy, openY + 2 * v.dy);
        checkOrientation = isHoriz ? 'horizontal' : 'vertical';
      }

      let collides = false;
      if (checkOrientation === 'horizontal') {
        if (occupied.has(`${checkGx},${checkGy}`) || occupied.has(`${checkGx + 1},${checkGy}`)) collides = true;
      } else {
        if (occupied.has(`${checkGx},${checkGy}`) || occupied.has(`${checkGx},${checkGy + 1}`)) collides = true;
      }
      if (!collides) {
        validDirs.push(d);
      }
    }

    let dir: PlacementDirection;
    if (chosenDirection && validDirs.includes(chosenDirection)) {
      dir = chosenDirection;
    } else if (validDirs.includes(turns.straight)) {
      dir = turns.straight;
    } else if (validDirs.length > 0) {
      dir = validDirs[0];
    } else {
      dir = turns.straight;
    }

    const v = DIR_VECTORS[dir];
    const isHoriz = v.dx !== 0;

    let c1x: number;
    let c1y: number;
    let c2x: number;
    let c2y: number;
    let orientation: 'horizontal' | 'vertical';
    let displayLeft: number;
    let displayRight: number;

    if (isTileDouble) {
      c1x = openX + v.dx;
      c1y = openY + v.dy;
      c2x = c1x;
      c2y = c1y;
      orientation = isHoriz ? 'vertical' : 'horizontal';
      displayLeft = tile.left;
      displayRight = tile.right;
    } else {
      c1x = openX + v.dx;
      c1y = openY + v.dy;
      c2x = openX + 2 * v.dx;
      c2y = openY + 2 * v.dy;
      orientation = isHoriz ? 'horizontal' : 'vertical';
      if (orientation === 'horizontal') {
        displayLeft = c1x < c2x ? matchedPip : openPip;
        displayRight = c1x < c2x ? openPip : matchedPip;
      } else {
        displayLeft = c1y < c2y ? matchedPip : openPip;
        displayRight = c1y < c2y ? openPip : matchedPip;
      }
    }

    const placed: PlacedTile = {
      tile,
      placedEnd: 'right',
      orientation,
      matchedPip,
      openPip,
      boardIndex: board.length,
      displayLeft,
      displayRight,
      x1: c1x,
      y1: c1y,
      x2: c2x,
      y2: c2y,
      direction: dir,
    };

    return {
      board: [...board, placed],
      newLeftEnd: currentLeftEnd,
      newRightEnd: openPip,
      newPlacedTile: placed,
    };
  }
}

/**
 * Guarantees all tiles on the board chain are displayed with matching pips facing each other
 * and ensures 2D layout coordinates are fully assigned.
 */
export function alignBoardDisplay(
  board: PlacedTile[],
  leftEnd: number | null,
  rightEnd: number | null
): PlacedTile[] {
  if (board.length === 0) return [];
  const allHave2D = board.every(t => t.x1 !== undefined && t.y1 !== undefined && t.x2 !== undefined && t.y2 !== undefined);
  if (allHave2D) {
    return board;
  }

  // Reconstruct 2D layout sequentially if any coordinates are missing
  let currentLeft: number | null = null;
  let currentRight: number | null = null;
  let reconstructed: PlacedTile[] = [];

  for (const item of board) {
    const end = item.placedEnd === 'left' ? 'left' : 'right';
    const res = applyMove(reconstructed, currentLeft, currentRight, item.tile, end, item.direction);
    reconstructed = res.board;
    currentLeft = res.newLeftEnd;
    currentRight = res.newRightEnd;
  }

  return reconstructed;
}

/**
 * Calculates score for "All Fives" (Muggins) rules.
 * If the sum of the open ends is a multiple of 5, that sum is awarded.
 */
export function calculateAllFivesScore(leftEnd: number | null, rightEnd: number | null): number {
  if (leftEnd === null || rightEnd === null) return 0;
  const sum = leftEnd + rightEnd;
  if (sum > 0 && sum % 5 === 0) {
    return sum;
  }
  return 0;
}

export interface RoundEndEvaluation {
  isOver: boolean;
  reason: 'domino' | 'blocked' | null;
  winnerPlayerId: string | null;
  winningTeam?: 1 | 2 | null;
  pointsAwarded: number;
  playerScores: Record<string, number>;
}

/**
 * Checks whether the round is complete (either a player played their last tile,
 * or the board is completely blocked for all players and the boneyard is empty).
 */
export function evaluateRoundEnd(
  players: Array<{ id: string; hand: DominoTile[]; team?: 1 | 2 }>,
  boneyardCount: number,
  leftEnd: number | null,
  rightEnd: number | null,
  mode: GameMode,
  is2v2: boolean = false
): RoundEndEvaluation {
  // 1. Check if any player emptied their hand (Domino!)
  for (const p of players) {
    if (p.hand.length === 0) {
      if (is2v2 && p.team) {
        const winningTeam = p.team;
        const opposingTeam = winningTeam === 1 ? 2 : 1;
        let points = 0;
        for (const other of players) {
          if (other.team === opposingTeam) {
            points += sumHandPips(other.hand);
          }
        }
        return {
          isOver: true,
          reason: 'domino',
          winnerPlayerId: p.id,
          winningTeam,
          pointsAwarded: points,
          playerScores: { [p.id]: points },
        };
      }

      // 1v1 / Standard
      let points = 0;
      for (const other of players) {
        if (other.id !== p.id) {
          points += sumHandPips(other.hand);
        }
      }
      return {
        isOver: true,
        reason: 'domino',
        winnerPlayerId: p.id,
        winningTeam: p.team || null,
        pointsAwarded: points,
        playerScores: { [p.id]: points },
      };
    }
  }

  // 2. Check if the game is blocked
  // In Block mode, no boneyard. In Draw mode, boneyard must also be empty.
  const boneyardExhausted = mode === 'block' || boneyardCount === 0;

  if (boneyardExhausted && leftEnd !== null && rightEnd !== null) {
    let anyPlayerCanMove = false;
    for (const p of players) {
      const moves = getPlayableMoves(p.hand, leftEnd, rightEnd);
      if (moves.length > 0) {
        anyPlayerCanMove = true;
        break;
      }
    }

    if (!anyPlayerCanMove) {
      // Board is blocked!
      if (is2v2) {
        let team1Pips = 0;
        let team2Pips = 0;
        let lowestP1: { id: string; pips: number } | null = null;
        let lowestP2: { id: string; pips: number } | null = null;

        for (const p of players) {
          const pips = sumHandPips(p.hand);
          if (p.team === 1) {
            team1Pips += pips;
            if (!lowestP1 || pips < lowestP1.pips) lowestP1 = { id: p.id, pips };
          } else {
            team2Pips += pips;
            if (!lowestP2 || pips < lowestP2.pips) lowestP2 = { id: p.id, pips };
          }
        }

        if (team1Pips === team2Pips) {
          return {
            isOver: true,
            reason: 'blocked',
            winnerPlayerId: null,
            winningTeam: null,
            pointsAwarded: 0,
            playerScores: {},
          };
        }

        const winningTeam = team1Pips < team2Pips ? 1 : 2;
        const winnerPlayer = winningTeam === 1 ? lowestP1 : lowestP2;
        const points = winningTeam === 1 ? team2Pips : team1Pips;

        return {
          isOver: true,
          reason: 'blocked',
          winnerPlayerId: winnerPlayer?.id || null,
          winningTeam,
          pointsAwarded: points,
          playerScores: winnerPlayer ? { [winnerPlayer.id]: points } : {},
        };
      }

      // 1v1 / Standard
      const pipCounts = players.map(p => ({
        id: p.id,
        pips: sumHandPips(p.hand),
      }));

      pipCounts.sort((a, b) => a.pips - b.pips);

      if (pipCounts.length >= 2 && pipCounts[0].pips === pipCounts[1].pips) {
        // Tie in blocked game
        return {
          isOver: true,
          reason: 'blocked',
          winnerPlayerId: null, // Tie
          pointsAwarded: 0,
          playerScores: {},
        };
      }

      const winner = pipCounts[0];
      let opponentPips = 0;
      for (let i = 1; i < pipCounts.length; i++) {
        opponentPips += pipCounts[i].pips;
      }
      const points = Math.max(0, opponentPips - winner.pips);

      return {
        isOver: true,
        reason: 'blocked',
        winnerPlayerId: winner.id,
        pointsAwarded: points,
        playerScores: { [winner.id]: points },
      };
    }
  }

  return {
    isOver: false,
    reason: null,
    winnerPlayerId: null,
    pointsAwarded: 0,
    playerScores: {},
  };
}

/**
 * AI Decision Engine with 3 distinct difficulty strategies:
 * - Novice: Random legal move or simple highest-pip play
 * - Tactician: Prioritizes heavy doubles, keeps versatile pips, defends open ends
 * - Grandmaster: Counts played tiles (28 total), minimizes pip exposure, predicts opponent blocks
 */
export function chooseAIMove(
  hand: DominoTile[],
  board: PlacedTile[],
  leftEnd: number | null,
  rightEnd: number | null,
  difficulty: AIDifficulty = 'tactician'
): { tile: DominoTile; end: 'left' | 'right' } | null {
  const validMoves = getPlayableMoves(hand, leftEnd, rightEnd);
  if (validMoves.length === 0) return null;

  if (difficulty === 'novice') {
    // Pick highest pip move 60% of the time, else random
    if (Math.random() > 0.4) {
      validMoves.sort((a, b) => getTilePips(b.tile) - getTilePips(a.tile));
      return validMoves[0];
    }
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  if (difficulty === 'tactician') {
    // Score each move:
    // +15 for doubles (get rid of heavy doubles early!)
    // + pips (shed weight)
    // + bonus if new open end matches other tiles in hand
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
      const isDouble = move.tile.left === move.tile.right;
      let score = getTilePips(move.tile) * 2;
      if (isDouble) score += 20;

      // Predict resulting open end
      let resultingOpenEnd: number;
      if (leftEnd === null || rightEnd === null) {
        resultingOpenEnd = move.tile.left; // arbitrary
      } else if (move.end === 'left') {
        resultingOpenEnd = move.tile.left === leftEnd ? move.tile.right : move.tile.left;
      } else {
        resultingOpenEnd = move.tile.left === rightEnd ? move.tile.right : move.tile.left;
      }

      // Check how many other tiles in hand have this new open end
      const handMatches = hand.filter(t => t.id !== move.tile.id && (t.left === resultingOpenEnd || t.right === resultingOpenEnd)).length;
      score += handMatches * 10;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // Grandmaster AI
  // Track all visible tiles (board + AI's hand).
  // 28 total tiles in double-six. Count how many of each number (0-6) are exhausted.
  const pipCountsInPlay: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const pt of board) {
    pipCountsInPlay[pt.tile.left]++;
    pipCountsInPlay[pt.tile.right]++;
  }
  for (const t of hand) {
    pipCountsInPlay[t.left]++;
    pipCountsInPlay[t.right]++;
  }

  let bestMove = validMoves[0];
  let bestScore = -Infinity;

  for (const move of validMoves) {
    const isDouble = move.tile.left === move.tile.right;
    let score = getTilePips(move.tile) * 3;
    if (isDouble) score += 25; // shedding doubles is critical to avoid being caught

    let resultingOpenEnd: number;
    if (leftEnd === null || rightEnd === null) {
      resultingOpenEnd = move.tile.left;
    } else if (move.end === 'left') {
      resultingOpenEnd = move.tile.left === leftEnd ? move.tile.right : move.tile.left;
    } else {
      resultingOpenEnd = move.tile.left === rightEnd ? move.tile.right : move.tile.left;
    }

    // Hand synergy: count how many remaining tiles in hand match the new open end
    const remainingHandMatches = hand.filter(
      t => t.id !== move.tile.id && (t.left === resultingOpenEnd || t.right === resultingOpenEnd)
    ).length;
    score += remainingHandMatches * 15;

    // Defense: if this number has been heavily played (near 7), opponent is less likely to have it
    const exhaustion = pipCountsInPlay[resultingOpenEnd] || 0;
    if (exhaustion >= 5 && remainingHandMatches > 0) {
      score += 20; // powerful lock play!
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
