import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDoubleSixSet,
  canPlayTile,
  getPlayableMoves,
  applyMove,
  calculateAllFivesScore,
  evaluateRoundEnd,
  sumHandPips,
  chooseAIMove,
} from './dominoCore';

test('createDoubleSixSet creates exactly 28 unique dominoes', () => {
  const set = createDoubleSixSet();
  assert.equal(set.length, 28);
  const ids = new Set(set.map(t => t.id));
  assert.equal(ids.size, 28);
  // Check double-six and double-zero exist
  assert.ok(set.some(t => t.left === 0 && t.right === 0));
  assert.ok(set.some(t => t.left === 6 && t.right === 6));
});

test('canPlayTile correctly identifies valid matching ends', () => {
  const tile1 = { id: '3-5', left: 3, right: 5 };
  
  // Empty board: can play anywhere
  assert.deepEqual(canPlayTile(tile1, null, null), { canLeft: true, canRight: true });

  // Board ends: 3 on left, 2 on right
  const check1 = canPlayTile(tile1, 3, 2);
  assert.equal(check1.canLeft, true);
  assert.equal(check1.canRight, false);

  // Board ends: 4 on left, 5 on right
  const check2 = canPlayTile(tile1, 4, 5);
  assert.equal(check2.canLeft, false);
  assert.equal(check2.canRight, true);

  // Board ends: neither matches
  const check3 = canPlayTile(tile1, 1, 6);
  assert.equal(check3.canLeft, false);
  assert.equal(check3.canRight, false);
});

test('applyMove updates board chain and open ends correctly', () => {
  // 1. Root move [3|5]
  const rootResult = applyMove([], null, null, { id: '3-5', left: 3, right: 5 }, 'left');
  assert.equal(rootResult.board.length, 1);
  assert.equal(rootResult.newLeftEnd, 3);
  assert.equal(rootResult.newRightEnd, 5);

  // 2. Play [3|2] to the left end (matching 3)
  const leftResult = applyMove(
    rootResult.board,
    rootResult.newLeftEnd,
    rootResult.newRightEnd,
    { id: '2-3', left: 2, right: 3 },
    'left'
  );
  assert.equal(leftResult.board.length, 2);
  assert.equal(leftResult.newLeftEnd, 2); // new open end on left is 2
  assert.equal(leftResult.newRightEnd, 5); // right end remains 5

  // 3. Play [5|5] (double) to the right end (matching 5)
  const rightResult = applyMove(
    leftResult.board,
    leftResult.newLeftEnd,
    leftResult.newRightEnd,
    { id: '5-5', left: 5, right: 5 },
    'right'
  );
  assert.equal(rightResult.board.length, 3);
  assert.equal(rightResult.newLeftEnd, 2);
  assert.equal(rightResult.newRightEnd, 5);
});

test('calculateAllFivesScore awards multiples of five correctly', () => {
  assert.equal(calculateAllFivesScore(null, null), 0);
  assert.equal(calculateAllFivesScore(2, 3), 5);
  assert.equal(calculateAllFivesScore(5, 5), 10);
  assert.equal(calculateAllFivesScore(6, 4), 10);
  assert.equal(calculateAllFivesScore(1, 4), 5);
  assert.equal(calculateAllFivesScore(2, 4), 0); // 6 is not multiple of 5
});

test('evaluateRoundEnd triggers Domino when a player empties hand', () => {
  const players = [
    { id: 'p1', hand: [] }, // emptied hand!
    { id: 'p2', hand: [{ id: '4-4', left: 4, right: 4 }, { id: '1-2', left: 1, right: 2 }] } // 8 + 3 = 11 pips
  ];

  const evalResult = evaluateRoundEnd(players, 5, 4, 2, 'draw');
  assert.equal(evalResult.isOver, true);
  assert.equal(evalResult.reason, 'domino');
  assert.equal(evalResult.winnerPlayerId, 'p1');
  assert.equal(evalResult.pointsAwarded, 11);
});

test('evaluateRoundEnd detects blocked game when boneyard is empty', () => {
  const players = [
    { id: 'p1', hand: [{ id: '1-1', left: 1, right: 1 }] }, // 2 pips
    { id: 'p2', hand: [{ id: '6-6', left: 6, right: 6 }] }  // 12 pips
  ];
  // Ends are 3 and 4, neither player can match, boneyard is 0
  const evalResult = evaluateRoundEnd(players, 0, 3, 4, 'draw');
  assert.equal(evalResult.isOver, true);
  assert.equal(evalResult.reason, 'blocked');
  assert.equal(evalResult.winnerPlayerId, 'p1');
  assert.equal(evalResult.pointsAwarded, 10); // 12 - 2 = 10
});

import { PlacedTile } from '../types/domino';

test('chooseAIMove selects valid playable moves', () => {
  const hand = [
    { id: '1-2', left: 1, right: 2 },
    { id: '3-4', left: 3, right: 4 },
    { id: '5-5', left: 5, right: 5 },
  ];
  const board: PlacedTile[] = [];
  const leftEnd = 3;
  const rightEnd = 6;

  const move = chooseAIMove(hand, board, leftEnd, rightEnd, 'tactician');
  assert.ok(move !== null);
  assert.equal(move.tile.id, '3-4');
  assert.equal(move.end, 'left');
});

import { alignBoardDisplay } from './dominoCore';

test('alignBoardDisplay ensures touching ends always have identical pips', () => {
  // Simulate the user game sequence from screenshot:
  // Root: [6|6]
  let r = applyMove([], null, null, { id: '6-6', left: 6, right: 6 }, 'left');
  // Play [2|6] on left -> newLeft = 2, right = 6
  r = applyMove(r.board, r.newLeftEnd, r.newRightEnd, { id: '2-6', left: 2, right: 6 }, 'left');
  // Play [2|3] on left -> newLeft = 3, right = 6
  r = applyMove(r.board, r.newLeftEnd, r.newRightEnd, { id: '2-3', left: 2, right: 3 }, 'left');
  // Play [3|3] on left -> newLeft = 3, right = 6
  r = applyMove(r.board, r.newLeftEnd, r.newRightEnd, { id: '3-3', left: 3, right: 3 }, 'left');
  // Play [5|6] on right -> left = 3, newRight = 5
  r = applyMove(r.board, r.newLeftEnd, r.newRightEnd, { id: '5-6', left: 5, right: 6 }, 'right');
  // Play [4|5] on right -> left = 3, newRight = 4
  r = applyMove(r.board, r.newLeftEnd, r.newRightEnd, { id: '4-5', left: 4, right: 5 }, 'right');

  assert.equal(r.newLeftEnd, 3);
  assert.equal(r.newRightEnd, 4);
  assert.equal(r.board.length, 6);

  const aligned = alignBoardDisplay(r.board, r.newLeftEnd, r.newRightEnd);
  assert.equal(aligned.length, 6);

  // Far left end must be 3
  assert.equal(aligned[0].displayLeft, 3);
  // Far right end must be 4
  assert.equal(aligned[aligned.length - 1].displayRight, 4);

  // Every adjacent pair MUST match pips at the contact point!
  for (let i = 0; i < aligned.length - 1; i++) {
    const currentRight = aligned[i].displayRight;
    const nextLeft = aligned[i + 1].displayLeft;
    assert.equal(
      currentRight,
      nextLeft,
      `Tile ${i} right pip (${currentRight}) must match Tile ${i + 1} left pip (${nextLeft})`
    );
  }

  // Check expected sequence: [3|3] - [3|2] - [2|6] - [6|6] - [6|5] - [5|4]
  assert.deepEqual(
    aligned.map(t => [t.displayLeft, t.displayRight]),
    [
      [3, 3], // double 3
      [3, 2], // 2-3 flipped so 3 touches 3 and 2 faces right
      [2, 6], // 2-6 with 2 touching 2 and 6 facing right
      [6, 6], // double 6 with 6 touching 6 and 6 facing right
      [6, 5], // 5-6 flipped so 6 touches 6 and 5 faces right
      [5, 4], // 4-5 flipped so 5 touches 5 and 4 faces right
    ]
  );
});

import { getCandidatePlacements } from './dominoCore';

test('getCandidatePlacements generates straight and 90-degree corner turns', () => {
  // Root move [6|6]
  let r = applyMove([], null, null, { id: '6-6', left: 6, right: 6 }, 'left');
  
  // Hand has tile [6|2]
  const tile62 = { id: '6-2', left: 6, right: 2 };
  const candidates = getCandidatePlacements(r.board, r.newLeftEnd, r.newRightEnd, tile62);
  
  // Left end (6) and right end (6) are both valid, offering straight and corner turns
  assert.ok(candidates.length >= 2, 'Should offer multiple placement directions');
  
  // Right end candidates should offer straight (right), turn up, turn down
  const rightCandidates = candidates.filter(c => c.end === 'right');
  assert.ok(rightCandidates.some(c => c.direction === 'right'), 'Offers straight placement');
  assert.ok(rightCandidates.some(c => c.direction === 'down'), 'Offers turn down placement');
  assert.ok(rightCandidates.some(c => c.direction === 'up'), 'Offers turn up placement');

  // Verify chosen turn down placement applies 2D coordinates correctly
  const turnDownResult = applyMove(r.board, r.newLeftEnd, r.newRightEnd, tile62, 'right', 'down');
  const placedTile = turnDownResult.newPlacedTile;
  assert.equal(placedTile.direction, 'down');
  assert.equal(placedTile.orientation, 'vertical');
  assert.equal(placedTile.y1, 1);
  assert.equal(placedTile.y2, 2);
  assert.equal(placedTile.x1, 0);
  assert.equal(placedTile.x2, 0);
});

test('double tiles attach crosswise (perpendicular) to the line of play', () => {
  // 1. Root move [6|6] is a vertical double
  const root = applyMove([], null, null, { id: '6-6', left: 6, right: 6 }, 'left');
  assert.equal(root.board[0].orientation, 'vertical');

  // 2. Play non-double [0|6] to the left (horizontal)
  const step1 = applyMove(root.board, root.newLeftEnd, root.newRightEnd, { id: '0-6', left: 0, right: 6 }, 'left', 'left');
  assert.equal(step1.newPlacedTile.orientation, 'horizontal');

  // 3. Play non-double [6|4] to the right (horizontal)
  const step2 = applyMove(step1.board, step1.newLeftEnd, step1.newRightEnd, { id: '4-6', left: 4, right: 6 }, 'right', 'right');
  assert.equal(step2.newPlacedTile.orientation, 'horizontal');

  // 4. Candidate for playing double [4|4] on the right (horizontal line of play)
  const doubleCandidates = getCandidatePlacements(step2.board, step2.newLeftEnd, step2.newRightEnd, { id: '4-4', left: 4, right: 4 });
  const rightDoubleCand = doubleCandidates.find(c => c.end === 'right' && c.direction === 'right');
  assert.ok(rightDoubleCand, 'Offers right placement for double');
  // In a horizontal line of play, a double MUST be vertical (crosswise)
  assert.equal(rightDoubleCand.orientation, 'vertical');

  // 5. Apply double [4|4] to the right
  const step3 = applyMove(step2.board, step2.newLeftEnd, step2.newRightEnd, { id: '4-4', left: 4, right: 4 }, 'right', 'right');
  assert.equal(step3.newPlacedTile.orientation, 'vertical');
  assert.equal(step3.newPlacedTile.x1, 3);
  assert.equal(step3.newPlacedTile.x2, 3);

  // 6. Play non-double [4|3] after double [4|4]
  const step4 = applyMove(step3.board, step3.newLeftEnd, step3.newRightEnd, { id: '3-4', left: 3, right: 4 }, 'right', 'right');
  assert.equal(step4.newPlacedTile.orientation, 'horizontal');
  // It must start at x=4, perfectly touching the double at x=3 (width=1 cell -> reaches x=4)!
  assert.equal(Math.min(step4.newPlacedTile.x1 ?? 0, step4.newPlacedTile.x2 ?? 0), 4);
});

test('horizontal lead opening double attaches top and bottom tiles flush with zero gap', () => {
  // 1. Root move [6|6] placed as Horizontal Lead ('right' direction choice on empty board)
  const root = applyMove([], null, null, { id: '6-6', left: 6, right: 6 }, 'left', 'right');
  assert.equal(root.board[0].orientation, 'horizontal');
  assert.equal(root.board[0].x1, 0);
  assert.equal(root.board[0].y1, 0);

  // 2. Play [4|6] on left end (top branch of horizontal double)
  const topMove = applyMove(root.board, root.newLeftEnd, root.newRightEnd, { id: '4-6', left: 4, right: 6 }, 'left', 'up');
  assert.equal(topMove.newPlacedTile.orientation, 'vertical');
  assert.equal(topMove.newPlacedTile.y1, -1);
  assert.equal(topMove.newPlacedTile.y2, -2);

  // 3. Play [6|0] on right end (bottom branch of horizontal double)
  const bottomMove = applyMove(topMove.board, topMove.newLeftEnd, topMove.newRightEnd, { id: '0-6', left: 0, right: 6 }, 'right', 'down');
  assert.equal(bottomMove.newPlacedTile.orientation, 'vertical');
  assert.equal(bottomMove.newPlacedTile.y1, 1);
  assert.equal(bottomMove.newPlacedTile.y2, 2);
});

test('mixed piece opening is strictly horizontal and attaches left and right', () => {
  // 1. Candidate placement for mixed piece on empty board must only return 1 option: horizontal
  const candidates = getCandidatePlacements([], null, null, { id: '1-2', left: 1, right: 2 });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].orientation, 'horizontal');

  // 2. Play [1|2] on empty board
  const root = applyMove([], null, null, { id: '1-2', left: 1, right: 2 }, 'left');
  assert.equal(root.board[0].orientation, 'horizontal');
  assert.equal(root.board[0].x1, 0);
  assert.equal(root.board[0].x2, 1);

  // 3. Play [2|4] on right end -> attaches to x=2, going right
  const rightMove = applyMove(root.board, root.newLeftEnd, root.newRightEnd, { id: '2-4', left: 2, right: 4 }, 'right', 'right');
  assert.equal(rightMove.newPlacedTile.orientation, 'horizontal');
  assert.equal(rightMove.newPlacedTile.x1, 2);
  assert.equal(rightMove.newPlacedTile.x2, 3);
});

