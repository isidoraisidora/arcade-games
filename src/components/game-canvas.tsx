"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  advanceGame,
  createGame,
  handleGameKey,
  type GameId,
  type GameState,
  type Point,
} from "@/lib/game-engine";

const PALETTE = ["#ff5fa2", "#5ee5cf", "#ffd166", "#8295ff"];

function pixel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), width, height);
}

function draw(game: GameState, id: GameId, context: CanvasRenderingContext2D) {
  context.fillStyle = "#091016";
  context.fillRect(0, 0, 600, 360);
  context.strokeStyle = "rgba(130, 149, 255, .07)";
  context.lineWidth = 1;
  for (let x = 0; x <= 600; x += 30) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 360);
    context.stroke();
  }
  for (let y = 0; y <= 360; y += 30) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(600, y);
    context.stroke();
  }

  if (id === "snake") {
    pixel(context, game.food.x * 30 + 9, game.food.y * 20 + 7, 12, 12, "#ff5fa2");
    game.snake.forEach((point, index) =>
      pixel(context, point.x * 30 + 2, point.y * 20 + 2, 26, 16, index ? "#5ee5cf" : "#e9fff3"),
    );
  }

  if (id === "tetris") {
    const cell = 18;
    const offsetX = 210;
    for (let y = 0; y < game.board.length; y++) {
      for (let x = 0; x < game.board[y].length; x++) {
        const value = game.board[y][x];
        if (value) {
          pixel(context, offsetX + x * cell + 1, y * cell + 1, cell - 2, cell - 2, PALETTE[value - 1]);
        }
      }
    }
    game.piece.cells.forEach((row, y) =>
      row.forEach((occupied, x) => {
        if (occupied) {
          pixel(context, offsetX + (game.piece.x + x) * cell + 1, (game.piece.y + y) * cell + 1, cell - 2, cell - 2, game.piece.color);
        }
      }),
    );
    context.strokeStyle = "rgba(255,255,255,.2)";
    context.strokeRect(offsetX, 0, 180, 324);
  }

  if (id === "breakout") {
    game.bricks.forEach((row, y) =>
      row.forEach((brick, x) => {
        if (brick) pixel(context, 30 + x * 60, 50 + y * 24, 52, 15, PALETTE[y % PALETTE.length]);
      }),
    );
    pixel(context, game.paddleX, 326, 100, 10, "#5ee5cf");
    pixel(context, game.ball.x - 6, game.ball.y - 6, 12, 12, "#fff3dc");
  }

  if (id === "pong") {
    context.setLineDash([7, 12]);
    context.strokeStyle = "rgba(255,255,255,.2)";
    context.beginPath();
    context.moveTo(300, 25);
    context.lineTo(300, 335);
    context.stroke();
    context.setLineDash([]);
    pixel(context, game.enemyPaddleX, 18, 90, 8, "#ff5fa2");
    pixel(context, game.paddleX, 334, 96, 8, "#5ee5cf");
    pixel(context, game.ball.x - 7, game.ball.y - 7, 14, 14, "#fff3dc");
  }

  if (id === "invaders") {
    game.enemies.forEach((enemy, index) => {
      pixel(context, enemy.x, enemy.y, 26, 14, PALETTE[Math.floor(index / 7) % PALETTE.length]);
      pixel(context, enemy.x + 4, enemy.y + 14, 5, 5, PALETTE[Math.floor(index / 7) % PALETTE.length]);
      pixel(context, enemy.x + 17, enemy.y + 14, 5, 5, PALETTE[Math.floor(index / 7) % PALETTE.length]);
    });
    pixel(context, game.playerX, 329, 42, 13, "#5ee5cf");
    pixel(context, game.playerX + 18, 322, 7, 10, "#5ee5cf");
    game.shots.forEach((shot: Point) => pixel(context, shot.x, shot.y, 4, 10, "#ffd166"));
  }

  context.font = "12px monospace";
  context.fillStyle = "rgba(233,255,243,.5)";
  context.fillText("SCORE", 17, 24);
  context.fillStyle = "#e9fff3";
  context.font = "bold 16px monospace";
  context.fillText(String(game.score).padStart(4, "0"), 17, 45);

  if (!game.started || game.over || game.paused) {
    context.fillStyle = "rgba(5, 9, 14, .78)";
    context.fillRect(0, 0, 600, 360);
    context.textAlign = "center";
    context.fillStyle = game.over ? "#ff5fa2" : "#5ee5cf";
    context.font = "bold 25px monospace";
    context.fillText(game.over ? "GAME OVER" : game.paused ? "PAUSED" : "READY, PLAYER 1?", 300, 170);
    context.fillStyle = "#fff3dc";
    context.font = "13px monospace";
    context.fillText(
      game.over ? "Press any key to start a new round" : game.paused ? "Press P to jump back in" : "Press any key to start",
      300,
      198,
    );
    context.textAlign = "start";
  }
}

export function GameCanvas({
  gameId,
  onFinish,
}: {
  gameId: GameId;
  onFinish: (points: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>(createGame());
  const finishRef = useRef(onFinish);
  const finishedRef = useRef(false);
  const [, setFrame] = useState(0);

  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context) draw(gameRef.current, gameId, context);
  }, [gameId]);

  useEffect(() => {
    const game = gameRef.current;
    const keydown = (event: KeyboardEvent) => {
      if (game.over) {
        event.preventDefault();
        if (!finishedRef.current) {
          finishedRef.current = true;
          finishRef.current(game.score);
        }
        finishedRef.current = false;
        handleGameKey(game, gameId, event.key);
        setFrame((frame) => frame + 1);
        return;
      }

      const accepted = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "w", "a", "s", "d", "p"];
      if (!accepted.includes(event.key)) return;
      event.preventDefault();
      handleGameKey(game, gameId, event.key);
      setFrame((frame) => frame + 1);
    };

    window.addEventListener("keydown", keydown);
    redraw();
    const timer = window.setInterval(() => {
      advanceGame(game, gameId);
      redraw();
      setFrame((frame) => frame + 1);

      if (game.over && !finishedRef.current) {
        finishedRef.current = true;
        finishRef.current(game.score);
      }
    }, gameId === "snake" ? 115 : gameId === "pong" ? 45 : 70);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", keydown);
      if (!finishedRef.current && game.started) {
        finishedRef.current = true;
        finishRef.current(game.score);
      }
    };
  }, [gameId, redraw]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      width={600}
      height={360}
      aria-label={`${gameId} game board. Use the arrow keys or WASD to play; press P to pause.`}
      role="img"
    />
  );
}
