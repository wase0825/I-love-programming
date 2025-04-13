const board = document.getElementById("board");
const passBtn = document.getElementById("pass-btn");
const intersections = 19;
const spacing = 30;

let boardState = Array.from({ length: intersections }, () => Array(intersections).fill(null));
let currentPlayer = "black";
let captured = { black: 0, white: 0 };
let consecutivePasses = 0; // 記錄連續 Pass 次數
let gameOver = false;

// 更新提子數顯示
const updateCaptureDisplay = () => {
  document.getElementById("black-count").textContent = captured.black;
  document.getElementById("white-count").textContent = captured.white;
};

// 深拷貝棋盤狀態
const deepCopyBoard = (board) => board.map(row => row.slice());

// 取得鄰近交點（不變）
const getNeighbors = (x, y) => {
  const neighbors = [];
  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < intersections - 1) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < intersections - 1) neighbors.push({ x, y: y + 1 });
  return neighbors;
};

// 取得連通群與氣數，利用特定棋盤（board）參數
const getGroupAndLibertiesFromBoard = (board, x, y, color) => {
  const stack = [{ x, y }];
  const visited = Array.from({ length: intersections }, () => Array(intersections).fill(false));
  const group = [];
  const liberties = new Set();
  while (stack.length) {
    const { x, y } = stack.pop();
    if (visited[y][x]) continue;
    visited[y][x] = true;
    group.push({ x, y });
    getNeighbors(x, y).forEach(n => {
      if (board[n.y][n.x] === null) liberties.add(`${n.x},${n.y}`);
      else if (board[n.y][n.x] === color && !visited[n.y][n.x]) stack.push(n);
    });
  }
  return { group, liberties: liberties.size };
};

// 原先函式保留，用於更新 DOM 與全域 captured
const getGroupAndLiberties = (x, y, color) => {
  return getGroupAndLibertiesFromBoard(boardState, x, y, color);
};

// 移除棋子（捕獲）：更新 DOM 及全域 captured
const removeStones = (group, color) => {
  const captureBox = document.getElementById(`${color}-captures`);
  const stoneClass = color === "black" ? "captured-white" : "captured-black";
  group.forEach(({ x, y }) => {
    boardState[y][x] = null;
    const cell = document.querySelector(`.intersection[data-x='${x}'][data-y='${y}']`);
    cell.classList.remove("black-stone", "white-stone");
    const stone = document.createElement("div");
    stone.className = `captured-stone ${stoneClass}`;
    captureBox.appendChild(stone);
  });
  captured[color] += group.length;
  updateCaptureDisplay();
};

// 僅移除棋子（僅影響 DOM，不更新 captured），用於回滾自殺走法
const removeStonesNoCapture = (group) => {
  group.forEach(({ x, y }) => {
    boardState[y][x] = null;
    const cell = document.querySelector(`.intersection[data-x='${x}'][data-y='${y}']`);
    cell.classList.remove("black-stone", "white-stone");
  });
};

// --- 新增：計算領地（空區） ---（同前略）
const calculateTerritory = () => {
  const visited = Array.from({ length: intersections }, () => Array(intersections).fill(false));
  let territory = { black: 0, white: 0 };

  for (let y = 0; y < intersections; y++) {
    for (let x = 0; x < intersections; x++) {
      if (boardState[y][x] === null && !visited[y][x]) {
        const queue = [{ x, y }];
        visited[y][x] = true;
        const region = [];
        const borderColors = new Set();

        while (queue.length) {
          const { x: cx, y: cy } = queue.shift();
          region.push({ x: cx, y: cy });
          getNeighbors(cx, cy).forEach(n => {
            if (boardState[n.y][n.x] === null) {
              if (!visited[n.y][n.x]) {
                visited[n.y][n.x] = true;
                queue.push(n);
              }
            } else {
              borderColors.add(boardState[n.y][n.x]);
            }
          });
        }
        if (borderColors.size === 1) {
          const owner = Array.from(borderColors)[0];
          territory[owner] += region.length;
        }
      }
    }
  }
  return territory;
};

// --- 新增：計算勝負結果 ---（同前略）
const calculateResult = () => {
  let blackStones = 0, whiteStones = 0;
  for (let y = 0; y < intersections; y++) {
    for (let x = 0; x < intersections; x++) {
      if (boardState[y][x] === "black") blackStones++;
      else if (boardState[y][x] === "white") whiteStones++;
    }
  }
  const territory = calculateTerritory();
  const totalBlack = blackStones + territory.black;
  const totalWhite = whiteStones + territory.white;
  const adjustedBlack = totalBlack - 3.75;

  let winner, margin;
  if (adjustedBlack > totalWhite) {
    winner = "黑勝";
    margin = (adjustedBlack - totalWhite).toFixed(2);
  } else if (totalWhite > adjustedBlack) {
    winner = "白勝";
    margin = (totalWhite - adjustedBlack).toFixed(2);
  } else {
    winner = "平局";
    margin = 0;
  }
  return { winner, margin, territory, blackStones, whiteStones };
};

const endGame = () => {
  gameOver = true;
  alert("雙方連續 Pass，對局結束！開始數地階段。");
  const result = calculateResult();
  alert(`結果：${result.winner}，差距：${result.margin}目\n黑子：${result.blackStones}, 黑領地：${result.territory.black}\n白子：${result.whiteStones}, 白領地：${result.territory.white}`);
};

for (let y = 0; y < intersections; y++) {
  for (let x = 0; x < intersections; x++) {
    const point = document.createElement("div");
    point.classList.add("intersection");
    point.style.left = `${x * spacing}px`;
    point.style.top = `${y * spacing}px`;
    point.dataset.x = x;
    point.dataset.y = y;

    point.addEventListener("click", () => {
      if (gameOver) return;
      if (boardState[y][x] !== null) return;

      // 重置 Pass 計數
      consecutivePasses = 0;

      // 保存當前棋盤狀態（深拷貝）
      const boardCopy = deepCopyBoard(boardState);

      // 暫時放置己方棋子
      boardState[y][x] = currentPlayer;
      point.classList.add(`${currentPlayer}-stone`);

      const enemy = currentPlayer === "black" ? "white" : "black";
      let capturedGroups = [];
      
      // 檢查鄰近敵棋，但先不執行捕獲
      const neighbors = getNeighbors(x, y);
      neighbors.forEach(n => {
        if (boardState[n.y][n.x] === enemy) {
          const res = getGroupAndLibertiesFromBoard(boardState, n.x, n.y, enemy);
          if (res.liberties === 0) {
            capturedGroups.push({ group: res.group, enemy });
          }
        }
      });
      
      // 模擬捕獲：建立 tempBoard 作暫時狀態
      let tempBoard = deepCopyBoard(boardState);
      capturedGroups.forEach(capture => {
        capture.group.forEach(({ x, y }) => {
          tempBoard[y][x] = null;
        });
      });
      
      // 檢查己方棋群氣數（從暫存狀態）
      const selfResult = getGroupAndLibertiesFromBoard(tempBoard, x, y, currentPlayer);
      
      if (selfResult.liberties === 0 && capturedGroups.length === 0) {
        // 自殺走法，回滾：恢復 boardState 與 DOM 的變化
        boardState = boardCopy;
        point.classList.remove(`${currentPlayer}-stone`);
        alert("自殺走法，不合法！");
        return;
      }
      
      // 自殺走法合法時：正式更新捕獲（更新 DOM 與全域 captured）
      capturedGroups.forEach(capture => {
        removeStones(capture.group, currentPlayer);
      });
      
      // 換手
      currentPlayer = currentPlayer === "black" ? "white" : "black";
    });

    board.appendChild(point);
  }
}

// Pass 按鈕事件
passBtn.addEventListener("click", () => {
  if (gameOver) return;
  consecutivePasses++;
  alert(`${currentPlayer} Pass`);
  if (consecutivePasses >= 2) {
    endGame();
  } else {
    currentPlayer = currentPlayer === "black" ? "white" : "black";
  }
});

// 新增：星位標記
const createStarPoints = (boardElement) => {
  const starCoords = [
    [3, 3], [3, 9], [3, 15],
    [9, 3], [9, 9], [9, 15],
    [15, 3], [15, 9], [15, 15],
  ];
  for (const [row, col] of starCoords) {
    const star = document.createElement("div");
    star.className = "star-point";
    star.style.left = `${col * spacing}px`;
    star.style.top = `${row * spacing}px`;
    boardElement.appendChild(star);
  }
};

// 在棋盤初始化時調用
createStarPoints(board);
