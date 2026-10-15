export const GAME_IDS = [
  "snake",
  "tetris",
  "breakout",
  "pong",
  "invaders",
] as const;

export type GameId = (typeof GAME_IDS)[number];
export type Point = { x: number; y: number };

type Piece = { cells: number[][]; x: number; y: number; color: string };

export type GameState = {
  score: number;
  started: boolean;
  over: boolean;
  paused: boolean;
  ticks: number;
  snake: Point[];
  food: Point;
  direction: "up" | "down" | "left" | "right";
  board: number[][];
  piece: Piece;
  paddleX: number;
  ball: Point & { vx: number; vy: number };
  bricks: boolean[][];
  enemyPaddleX: number;
  enemies: Point[];
  enemyDirection: number;
  shots: Point[];
  playerX: number;
};

const COLORS = ["#ff5fa2", "#5ee5cf", "#ffd166", "#8295ff"];
const TETRIS_PIECES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
];

function randomFood(snake: Point[]): Point {
  let food: Point;
  do {
    food = {
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 16),
    };
  } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
  return food;
}

function newPiece(): Piece {
  const index = Math.floor(Math.random() * TETRIS_PIECES.length);
  return {
    cells: TETRIS_PIECES[index].map((row) => [...row]),
    x: 4,
    y: 0,
    color: COLORS[index % COLORS.length],
  };
}

export function createGame(): GameState {
  const snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];

  return {
    score: 0,
    started: false,
    over: false,
    paused: false,
    ticks: 0,
    snake,
    food: randomFood(snake),
    direction: "right",
    board: Array.from({ length: 18 }, () => Array(10).fill(0)),
    piece: newPiece(),
    paddleX: 270,
    ball: { x: 300, y: 250, vx: 3.4, vy: 3.6 },
    bricks: Array.from({ length: 4 }, () => Array(9).fill(true)),
    enemyPaddleX: 270,
    enemies: Array.from({ length: 3 }, (_, row) =>
      Array.from({ length: 7 }, (_, col) => ({ x: 114 + col * 54, y: 74 + row * 38 })),
    ).flat(),
    enemyDirection: 1,
    shots: [],
    playerX: 280,
  };
}

function collides(board: number[][], cells: number[][], x: number, y: number) {
  return cells.some((row, dy) =>
    row.some(
      (cell, dx) =>
        cell === 1 &&
        (x + dx < 0 ||
          x + dx >= 10 ||
          y + dy >= 18 ||
          (y + dy >= 0 && board[y + dy][x + dx] !== 0)),
    ),
  );
}

function rotatePiece(piece: Piece) {
  const rotated = piece.cells[0].map((_, index) =>
    piece.cells.map((row) => row[index]).reverse(),
  );
  piece.cells = rotated;
}

function lockPiece(game: GameState) {
  for (let y = 0; y < game.piece.cells.length; y++) {
    for (let x = 0; x < game.piece.cells[y].length; x++) {
      if (game.piece.cells[y][x] && game.piece.y + y >= 0) {
        game.board[game.piece.y + y][game.piece.x + x] = COLORS.indexOf(game.piece.color) + 1;
      }
    }
  }
  const remaining = game.board.filter((row) => row.some((cell) => cell === 0));
  game.score += (18 - remaining.length) * 100;
  game.board = [...Array.from({ length: 18 - remaining.length }, () => Array(10).fill(0)), ...remaining];
  game.piece = newPiece();
  if (collides(game.board, game.piece.cells, game.piece.x, game.piece.y)) game.over = true;
}

function stepTetris(game: GameState) {
  if (game.ticks % 5 !== 0) return;
  if (!collides(game.board, game.piece.cells, game.piece.x, game.piece.y + 1)) {
    game.piece.y++;
  } else {
    lockPiece(game);
  }
}

function stepSnake(game: GameState) {
  if (game.ticks % 2 !== 0) return;
  const head = { ...game.snake[0] };
  if (game.direction === "up") head.y--;
  if (game.direction === "down") head.y++;
  if (game.direction === "left") head.x--;
  if (game.direction === "right") head.x++;
  const eatsFood = head.x === game.food.x && head.y === game.food.y;

  if (
    head.x < 0 ||
    head.x >= 20 ||
    head.y < 0 ||
    head.y >= 16 ||
    game.snake.slice(0, eatsFood ? undefined : -1).some((point) => point.x === head.x && point.y === head.y)
  ) {
    game.over = true;
    return;
  }

  game.snake.unshift(head);
  if (eatsFood) {
    game.score += 10;
    game.food = randomFood(game.snake);
  } else {
    game.snake.pop();
  }
}

function stepBreakout(game: GameState) {
  const ball = game.ball;
  ball.x += ball.vx;
  ball.y += ball.vy;
  if (ball.x < 10 || ball.x > 590) ball.vx *= -1;
  if (ball.y < 12) ball.vy = Math.abs(ball.vy);

  if (ball.vy > 0 && ball.y > 315 && ball.y < 336 && ball.x > game.paddleX - 8 && ball.x < game.paddleX + 108) {
    ball.vy = -Math.abs(ball.vy);
    ball.vx = Math.max(-6, Math.min(6, ball.vx + (ball.x - (game.paddleX + 50)) * 0.04));
  }

  const col = Math.floor((ball.x - 30) / 60);
  const row = Math.floor((ball.y - 50) / 24);
  if (row >= 0 && row < game.bricks.length && col >= 0 && col < 9 && game.bricks[row][col]) {
    game.bricks[row][col] = false;
    ball.vy *= -1;
    game.score += 10;
    if (game.bricks.every((brickRow) => brickRow.every((brick) => !brick))) game.bricks = Array.from({ length: 4 }, () => Array(9).fill(true));
  }
  if (ball.y > 370) game.over = true;
}

function stepPong(game: GameState) {
  const ball = game.ball;
  ball.x += ball.vx;
  ball.y += ball.vy;
  if (ball.x < 12 || ball.x > 588) ball.vx *= -1;
  game.enemyPaddleX += Math.sign(ball.x - (game.enemyPaddleX + 45)) * 2.2;

  if (ball.vy > 0 && ball.y > 328 && ball.y < 348 && ball.x > game.paddleX - 5 && ball.x < game.paddleX + 96) {
    ball.vy = -Math.abs(ball.vy);
    ball.vx += (ball.x - (game.paddleX + 48)) * 0.035;
    game.score += 1;
  } else if (ball.vy < 0 && ball.y < 29 && ball.x > game.enemyPaddleX && ball.x < game.enemyPaddleX + 90) {
    ball.vy = Math.abs(ball.vy);
  }
  if (ball.y < 0 || ball.y > 370) {
    game.over = true;
    return;
  }
  game.enemyPaddleX = Math.max(0, Math.min(510, game.enemyPaddleX));
}

function stepInvaders(game: GameState) {
  if (game.ticks % 2 === 0 && game.enemies.length) {
    const atEdge = game.enemies.some(
      (enemy) =>
        enemy.x + game.enemyDirection * 8 < 14 ||
        enemy.x + game.enemyDirection * 8 > 574,
    );
    if (atEdge) {
      game.enemyDirection *= -1;
      game.enemies.forEach((enemy) => (enemy.y += 14));
    } else {
      game.enemies.forEach((enemy) => (enemy.x += game.enemyDirection * 8));
    }
  }
  game.shots = game.shots.filter((shot) => shot.y > -10);
  game.shots.forEach((shot) => (shot.y -= 9));

  for (const shot of [...game.shots]) {
    const targetIndex = game.enemies.findIndex(
      (enemy) => Math.abs(enemy.x + 14 - shot.x) < 21 && Math.abs(enemy.y + 10 - shot.y) < 20,
    );
    if (targetIndex !== -1) {
      game.enemies.splice(targetIndex, 1);
      game.shots.splice(game.shots.indexOf(shot), 1);
      game.score += 10;
    }
  }

  if (game.enemies.some((enemy) => enemy.y > 310)) game.over = true;
  if (game.enemies.length === 0) {
    game.enemies = Array.from({ length: 21 }, (_, index) => ({
      x: 114 + (index % 7) * 54,
      y: 54 + Math.floor(index / 7) * 34,
    }));
    game.score += 100;
  }
}

export function advanceGame(game: GameState, id: GameId) {
  if (!game.started || game.over || game.paused) return;
  game.ticks++;
  if (id === "snake") stepSnake(game);
  if (id === "tetris") stepTetris(game);
  if (id === "breakout") stepBreakout(game);
  if (id === "pong") stepPong(game);
  if (id === "invaders") stepInvaders(game);
}

export function handleGameKey(game: GameState, id: GameId, key: string) {
  const normalized = key.toLowerCase();
  if (normalized === "p" && !game.over) {
    game.paused = !game.paused;
    return;
  }
  if (game.over || game.paused) return;
  game.started = true;

  if (id === "snake") {
    const turns = {
      arrowup: ["down", "up"],
      w: ["down", "up"],
      arrowdown: ["up", "down"],
      s: ["up", "down"],
      arrowleft: ["right", "left"],
      a: ["right", "left"],
      arrowright: ["left", "right"],
      d: ["left", "right"],
    } as const;
    const turn = turns[normalized as keyof typeof turns];
    if (turn && game.direction !== turn[0]) game.direction = turn[1];
  }

  if (id === "tetris") {
    if (normalized === "arrowleft" || normalized === "a") {
      if (!collides(game.board, game.piece.cells, game.piece.x - 1, game.piece.y)) game.piece.x--;
    }
    if (normalized === "arrowright" || normalized === "d") {
      if (!collides(game.board, game.piece.cells, game.piece.x + 1, game.piece.y)) game.piece.x++;
    }
    if (normalized === "arrowdown") stepTetris(game);
    if (normalized === "arrowup" || normalized === " ") {
      const original = game.piece.cells;
      rotatePiece(game.piece);
      if (collides(game.board, game.piece.cells, game.piece.x, game.piece.y)) game.piece.cells = original;
    }
  }

  if (id === "breakout" || id === "pong") {
    if (normalized === "arrowleft" || normalized === "a") game.paddleX = Math.max(8, game.paddleX - 30);
    if (normalized === "arrowright" || normalized === "d") game.paddleX = Math.min(492, game.paddleX + 30);
  }

  if (id === "invaders") {
    if (normalized === "arrowleft" || normalized === "a") game.playerX = Math.max(15, game.playerX - 26);
    if (normalized === "arrowright" || normalized === "d") game.playerX = Math.min(555, game.playerX + 26);
    if (normalized === " " && game.shots.length < 3) game.shots.push({ x: game.playerX + 21, y: 323 });
  }
}
