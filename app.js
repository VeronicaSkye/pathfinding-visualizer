/**
 * PathFinder Lab — Motor de Busca em Grafos & Menor Caminho
 * Algoritmos: Dijkstra, A* Search, BFS e DFS com Min-Heap
 */

// ============================================================================
// 1. Áudio Sintetizado (Web Audio API)
// ============================================================================
class PathSound {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('path_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playVisitTone(step, maxSteps = 400) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Frequência varia suavemente de 220Hz a 880Hz
    const freq = 220 + ((step % maxSteps) / maxSteps) * 660;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.06);
      osc.stop(this.ctx.currentTime + idx * 0.06 + 0.4);
    });
  }

  toggle() {
    this.muted = !this.muted;
    localStorage.setItem('path_muted', this.muted);
    return this.muted;
  }
}

const sound = new PathSound();

// ============================================================================
// 2. Estrutura de Dados Min-Heap (Fila de Prioridade Eficiente)
// ============================================================================
class MinHeap {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.heap = [];
    this.comparator = comparator;
  }

  push(element) {
    this.heap.push(element);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.isEmpty()) return null;
    const root = this.heap[0];
    const end = this.heap.pop();
    if (!this.isEmpty()) {
      this.heap[0] = end;
      this._sinkDown(0);
    }
    return root;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  _bubbleUp(idx) {
    const element = this.heap[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      if (this.comparator(element, parent) >= 0) break;
      this.heap[idx] = parent;
      this.heap[parentIdx] = element;
      idx = parentIdx;
    }
  }

  _sinkDown(idx) {
    const length = this.heap.length;
    const element = this.heap[idx];
    while (true) {
      const leftIdx = 2 * idx + 1;
      const rightIdx = 2 * idx + 2;
      let left, right;
      let swap = null;

      if (leftIdx < length) {
        left = this.heap[leftIdx];
        if (this.comparator(left, element) < 0) {
          swap = leftIdx;
        }
      }

      if (rightIdx < length) {
        right = this.heap[rightIdx];
        if (
          (swap === null && this.comparator(right, element) < 0) ||
          (swap !== null && this.comparator(right, left) < 0)
        ) {
          swap = rightIdx;
        }
      }

      if (swap === null) break;
      this.heap[idx] = this.heap[swap];
      this.heap[swap] = element;
      idx = swap;
    }
  }
}

// ============================================================================
// 3. Informações dos Algoritmos
// ============================================================================
const ALGO_DETAILS = {
  astar: {
    title: 'A* Search (A-Estrela)',
    guarantee: true,
    desc: 'Utiliza uma função de custo heurística <strong>f(n) = g(n) + h(n)</strong>, onde <em>g(n)</em> é a distância percorrida do início até o nó atual e <em>h(n)</em> é a estimativa de distância até o destino (Manhattan Distance). É o padrão da indústria de jogos e GPS.',
    timeComp: 'O(E log V)',
    spaceComp: 'O(V)',
    weights: 'Sim (ponderado)'
  },
  dijkstra: {
    title: 'Algoritmo de Dijkstra',
    guarantee: true,
    desc: 'O algoritmo clássico formulado por Edsger Dijkstra em 1956. Relaxa as arestas e garante o menor caminho explorando uniformemente em todas as direções a partir do início.',
    timeComp: 'O((V + E) log V)',
    spaceComp: 'O(V)',
    weights: 'Sim (ponderado)'
  },
  bfs: {
    title: 'Breadth-First Search (Busca em Largura)',
    guarantee: true,
    desc: 'Explora todos os vizinhos no nível atual antes de avançar para o próximo nível (fila FIFO). Garante o menor número de saltos em grafos não ponderados (ignora pesos adicionais).',
    timeComp: 'O(V + E)',
    spaceComp: 'O(V)',
    weights: 'Não (desconsidera pesos)'
  },
  dfs: {
    title: 'Depth-First Search (Busca em Profundidade)',
    guarantee: false,
    desc: 'Mergulha o mais fundo possível em cada ramo antes de retroceder (pilha LIFO / recursão). Não garante o menor caminho, comportando-se como uma serpente explorando o labirinto.',
    timeComp: 'O(V + E)',
    spaceComp: 'O(V)',
    weights: 'Não (desconsidera pesos)'
  }
};

// ============================================================================
// 4. Controlador da Grade & Motor de Pathfinding
// ============================================================================
class PathfindingGrid {
  constructor() {
    this.rows = 21;
    this.cols = 43;
    this.grid = [];

    this.startPos = { r: 10, c: 8 };
    this.targetPos = { r: 10, c: 34 };

    this.currentMode = 'wall'; // 'wall', 'weight', 'erase'
    this.isMouseDown = false;
    this.isDraggingStart = false;
    this.isDraggingTarget = false;

    this.isRunning = false;
    this.hasRunOnce = false; // Permite recalcular instantâneo ao mover nós

    this.initDOM();
    this.createGrid();
    this.updateInfoPanel('astar');
  }

  initDOM() {
    // Modo de pincel (parede, peso, borracha)
    document.querySelectorAll('.btn-mode').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentMode = e.currentTarget.dataset.mode;
      });
    });

    // Seletor de algoritmo
    const algoSelect = document.getElementById('algo-select');
    algoSelect.addEventListener('change', (e) => {
      this.updateInfoPanel(e.target.value);
      if (this.hasRunOnce) this.runInstant();
    });

    // Seletor de labirinto
    const mazeSelect = document.getElementById('maze-select');
    mazeSelect.addEventListener('change', (e) => {
      if (this.isRunning) return;
      this.generateMaze(e.target.value);
      e.target.value = ''; // Reset select
    });

    // Ações
    document.getElementById('btn-run').addEventListener('click', () => this.visualize());
    document.getElementById('btn-clear-path').addEventListener('click', () => this.clearPath());
    document.getElementById('btn-clear-all').addEventListener('click', () => this.clearAll());

    // Som
    const btnSound = document.getElementById('btn-sound');
    const soundIcon = document.getElementById('sound-icon');
    soundIcon.textContent = sound.muted ? '🔇' : '🔊';
    btnSound.addEventListener('click', () => {
      const isMuted = sound.toggle();
      soundIcon.textContent = isMuted ? '🔇' : '🔊';
    });

    // Modal de Teoria
    const btnGuide = document.getElementById('btn-guide');
    const guideModal = document.getElementById('guide-modal');
    const btnCloseGuide = document.getElementById('btn-close-guide');
    const btnUnderstood = document.getElementById('btn-understood-guide');

    btnGuide.addEventListener('click', () => guideModal.style.display = 'flex');
    [btnCloseGuide, btnUnderstood].forEach(b => {
      b.addEventListener('click', () => guideModal.style.display = 'none');
    });

    // Mouse up global
    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.isDraggingStart = false;
      this.isDraggingTarget = false;
    });
  }

  createGrid() {
    const boardEl = document.getElementById('grid-board');
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${this.cols}, 24px)`;
    boardEl.style.gridTemplateRows = `repeat(${this.rows}, 24px)`;

    this.grid = [];

    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        const isStart = (r === this.startPos.r && c === this.startPos.c);
        const isTarget = (r === this.targetPos.r && c === this.targetPos.c);

        const nodeObj = {
          r,
          c,
          isStart,
          isTarget,
          isWall: false,
          isWeight: false,
          weight: 1,
          distance: Infinity,
          fScore: Infinity,
          gScore: Infinity,
          isVisited: false,
          previousNode: null,
          element: null
        };

        const cellEl = document.createElement('div');
        cellEl.className = 'node';
        cellEl.id = `node-${r}-${c}`;

        if (isStart) {
          cellEl.classList.add('node-start');
          cellEl.textContent = '🚀';
        } else if (isTarget) {
          cellEl.classList.add('node-target');
          cellEl.textContent = '🎯';
        }

        // Eventos de clique e arrasto
        cellEl.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (this.isRunning) return;
          this.isMouseDown = true;

          if (isStart) {
            this.isDraggingStart = true;
          } else if (isTarget) {
            this.isDraggingTarget = true;
          } else {
            this.toggleNodeState(r, c);
          }
        });

        cellEl.addEventListener('mouseenter', () => {
          if (!this.isMouseDown || this.isRunning) return;

          if (this.isDraggingStart) {
            this.moveStartNode(r, c);
          } else if (this.isDraggingTarget) {
            this.moveTargetNode(r, c);
          } else {
            this.toggleNodeState(r, c);
          }
        });

        nodeObj.element = cellEl;
        row.push(nodeObj);
        boardEl.appendChild(cellEl);
      }
      this.grid.push(row);
    }
  }

  toggleNodeState(r, c) {
    const node = this.grid[r][c];
    if (node.isStart || node.isTarget) return;

    if (this.currentMode === 'wall') {
      node.isWall = !node.isWall;
      node.isWeight = false;
      node.weight = 1;
      node.element.classList.toggle('node-wall', node.isWall);
      node.element.classList.remove('node-weight');
    } else if (this.currentMode === 'weight') {
      node.isWeight = !node.isWeight;
      node.isWall = false;
      node.weight = node.isWeight ? 5 : 1;
      node.element.classList.toggle('node-weight', node.isWeight);
      node.element.classList.remove('node-wall');
    } else if (this.currentMode === 'erase') {
      node.isWall = false;
      node.isWeight = false;
      node.weight = 1;
      node.element.classList.remove('node-wall', 'node-weight');
    }

    if (this.hasRunOnce) {
      this.runInstant();
    }
  }

  moveStartNode(r, c) {
    const node = this.grid[r][c];
    if (node.isTarget || node.isWall) return;

    // Remove do antigo
    const oldNode = this.grid[this.startPos.r][this.startPos.c];
    oldNode.isStart = false;
    oldNode.element.classList.remove('node-start');
    oldNode.element.textContent = '';

    // Coloca no novo
    this.startPos = { r, c };
    node.isStart = true;
    node.element.classList.add('node-start');
    node.element.textContent = '🚀';

    if (this.hasRunOnce) this.runInstant();
  }

  moveTargetNode(r, c) {
    const node = this.grid[r][c];
    if (node.isStart || node.isWall) return;

    // Remove do antigo
    const oldNode = this.grid[this.targetPos.r][this.targetPos.c];
    oldNode.isTarget = false;
    oldNode.element.classList.remove('node-target');
    oldNode.element.textContent = '';

    // Coloca no novo
    this.targetPos = { r, c };
    node.isTarget = true;
    node.element.classList.add('node-target');
    node.element.textContent = '🎯';

    if (this.hasRunOnce) this.runInstant();
  }

  // ==========================================================================
  // Algoritmos de Busca
  // ==========================================================================
  async visualize() {
    if (this.isRunning) return;
    this.clearPath();
    this.isRunning = true;
    document.getElementById('btn-run').disabled = true;

    const algoKey = document.getElementById('algo-select').value;
    const startTime = performance.now();

    const startNode = this.grid[this.startPos.r][this.startPos.c];
    const targetNode = this.grid[this.targetPos.r][this.targetPos.c];

    let visitedNodesInOrder = [];
    if (algoKey === 'astar') {
      visitedNodesInOrder = this.solveAStar(startNode, targetNode);
    } else if (algoKey === 'dijkstra') {
      visitedNodesInOrder = this.solveDijkstra(startNode, targetNode);
    } else if (algoKey === 'bfs') {
      visitedNodesInOrder = this.solveBFS(startNode, targetNode);
    } else if (algoKey === 'dfs') {
      visitedNodesInOrder = this.solveDFS(startNode, targetNode);
    }

    const shortestPathNodes = this.getShortestPathNodes(targetNode);
    const elapsed = Math.round(performance.now() - startTime);

    await this.animateSearch(visitedNodesInOrder, shortestPathNodes);

    // Atualiza métricas
    document.getElementById('metric-visited').textContent = visitedNodesInOrder.length;
    document.getElementById('metric-length').textContent = shortestPathNodes.length;
    const totalCost = shortestPathNodes.reduce((acc, n) => acc + n.weight, 0);
    document.getElementById('metric-cost').textContent = totalCost;
    document.getElementById('metric-time').textContent = `${elapsed} ms`;

    this.isRunning = false;
    this.hasRunOnce = true;
    document.getElementById('btn-run').disabled = false;
  }

  runInstant() {
    this.clearPath();
    const algoKey = document.getElementById('algo-select').value;
    const startNode = this.grid[this.startPos.r][this.startPos.c];
    const targetNode = this.grid[this.targetPos.r][this.targetPos.c];

    let visitedNodesInOrder = [];
    if (algoKey === 'astar') visitedNodesInOrder = this.solveAStar(startNode, targetNode);
    else if (algoKey === 'dijkstra') visitedNodesInOrder = this.solveDijkstra(startNode, targetNode);
    else if (algoKey === 'bfs') visitedNodesInOrder = this.solveBFS(startNode, targetNode);
    else if (algoKey === 'dfs') visitedNodesInOrder = this.solveDFS(startNode, targetNode);

    const shortestPathNodes = this.getShortestPathNodes(targetNode);

    // Aplica classes instantaneamente sem animação
    visitedNodesInOrder.forEach(node => {
      if (!node.isStart && !node.isTarget) node.element.classList.add('node-visited');
    });

    shortestPathNodes.forEach(node => {
      if (!node.isStart && !node.isTarget) node.element.classList.add('node-shortest-path');
    });

    document.getElementById('metric-visited').textContent = visitedNodesInOrder.length;
    document.getElementById('metric-length').textContent = shortestPathNodes.length;
    document.getElementById('metric-cost').textContent = shortestPathNodes.reduce((acc, n) => acc + n.weight, 0);
  }

  // A* Search
  solveAStar(startNode, targetNode) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    startNode.gScore = 0;
    startNode.fScore = this.manhattanDistance(startNode, targetNode);

    const minHeap = new MinHeap((a, b) => a.fScore - b.fScore);
    minHeap.push(startNode);

    while (!minHeap.isEmpty()) {
      const current = minHeap.pop();

      if (current.isWall) continue;
      if (current.isVisited) continue;
      current.isVisited = true;
      visitedNodesInOrder.push(current);

      if (current === targetNode) return visitedNodesInOrder;

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (neighbor.isVisited || neighbor.isWall) continue;

        const tentativeGScore = current.gScore + neighbor.weight;
        if (tentativeGScore < neighbor.gScore) {
          neighbor.previousNode = current;
          neighbor.gScore = tentativeGScore;
          neighbor.distance = tentativeGScore;
          neighbor.fScore = neighbor.gScore + this.manhattanDistance(neighbor, targetNode);
          minHeap.push(neighbor);
        }
      }
    }
    return visitedNodesInOrder;
  }

  // Dijkstra
  solveDijkstra(startNode, targetNode) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;

    const minHeap = new MinHeap((a, b) => a.distance - b.distance);
    minHeap.push(startNode);

    while (!minHeap.isEmpty()) {
      const current = minHeap.pop();

      if (current.isWall) continue;
      if (current.isVisited) continue;
      current.isVisited = true;
      visitedNodesInOrder.push(current);

      if (current === targetNode) return visitedNodesInOrder;

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (neighbor.isVisited || neighbor.isWall) continue;

        const tentativeDistance = current.distance + neighbor.weight;
        if (tentativeDistance < neighbor.distance) {
          neighbor.distance = tentativeDistance;
          neighbor.previousNode = current;
          minHeap.push(neighbor);
        }
      }
    }
    return visitedNodesInOrder;
  }

  // BFS (Queue FIFO)
  solveBFS(startNode, targetNode) {
    const visitedNodesInOrder = [];
    const queue = [startNode];
    startNode.isVisited = true;

    while (queue.length > 0) {
      const current = queue.shift();
      visitedNodesInOrder.push(current);

      if (current === targetNode) return visitedNodesInOrder;

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (neighbor.isVisited || neighbor.isWall) continue;
        neighbor.isVisited = true;
        neighbor.previousNode = current;
        queue.push(neighbor);
      }
    }
    return visitedNodesInOrder;
  }

  // DFS (Stack LIFO)
  solveDFS(startNode, targetNode) {
    const visitedNodesInOrder = [];
    const stack = [startNode];

    while (stack.length > 0) {
      const current = stack.pop();

      if (current.isWall) continue;
      if (current.isVisited) continue;
      current.isVisited = true;
      visitedNodesInOrder.push(current);

      if (current === targetNode) return visitedNodesInOrder;

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited && !neighbor.isWall) {
          neighbor.previousNode = current;
          stack.push(neighbor);
        }
      }
    }
    return visitedNodesInOrder;
  }

  getNeighbors(node) {
    const neighbors = [];
    const { r, c } = node;
    if (r > 0) neighbors.push(this.grid[r - 1][c]);
    if (r < this.rows - 1) neighbors.push(this.grid[r + 1][c]);
    if (c > 0) neighbors.push(this.grid[r][c - 1]);
    if (c < this.cols - 1) neighbors.push(this.grid[r][c + 1]);
    return neighbors;
  }

  manhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.r - nodeB.r) + Math.abs(nodeA.c - nodeB.c);
  }

  getShortestPathNodes(targetNode) {
    const nodes = [];
    let current = targetNode;
    while (current !== null) {
      nodes.unshift(current);
      current = current.previousNode;
    }
    // Se o caminho não começa no startNode (alvo inalcançável)
    if (nodes.length > 0 && !nodes[0].isStart) return [];
    return nodes;
  }

  // ==========================================================================
  // Animação Assíncrona dos Nós
  // ==========================================================================
  animateSearch(visitedNodesInOrder, shortestPathNodes) {
    return new Promise(resolve => {
      const totalVisited = visitedNodesInOrder.length;
      for (let i = 0; i <= totalVisited; i++) {
        if (i === totalVisited) {
          setTimeout(() => {
            this.animateShortestPath(shortestPathNodes, resolve);
          }, 8 * i);
          return;
        }

        setTimeout(() => {
          const node = visitedNodesInOrder[i];
          if (!node.isStart && !node.isTarget) {
            node.element.classList.add('node-visited');
          }
          if (i % 4 === 0) {
            sound.playVisitTone(i, totalVisited);
          }
        }, 8 * i);
      }
    });
  }

  animateShortestPath(shortestPathNodes, resolve) {
    if (shortestPathNodes.length === 0) {
      resolve();
      return;
    }

    sound.playSuccess();
    for (let i = 0; i < shortestPathNodes.length; i++) {
      setTimeout(() => {
        const node = shortestPathNodes[i];
        if (!node.isStart && !node.isTarget) {
          node.element.classList.add('node-shortest-path');
        }
        if (i === shortestPathNodes.length - 1) {
          resolve();
        }
      }, 25 * i);
    }
  }

  // ==========================================================================
  // Geradores de Labirintos
  // ==========================================================================
  generateMaze(type) {
    this.clearAll();

    if (type === 'random') {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const node = this.grid[r][c];
          if (node.isStart || node.isTarget) continue;
          if (Math.random() < 0.28) {
            node.isWall = true;
            node.element.classList.add('node-wall');
          }
        }
      }
    } else if (type === 'stair') {
      let r = 1;
      let c = 1;
      while (r < this.rows - 1 && c < this.cols - 1) {
        const node = this.grid[r][c];
        if (!node.isStart && !node.isTarget) {
          node.isWall = true;
          node.element.classList.add('node-wall');
        }
        r++;
        c += 2;
      }
    } else if (type === 'recursive') {
      // Cria bordas externas com aberturas e câmaras internas
      for (let r = 0; r < this.rows; r += 4) {
        const passage = Math.floor(Math.random() * (this.cols - 4)) + 2;
        for (let c = 0; c < this.cols; c++) {
          if (c === passage || c === passage + 1) continue;
          const node = this.grid[r][c];
          if (!node.isStart && !node.isTarget) {
            node.isWall = true;
            node.element.classList.add('node-wall');
          }
        }
      }

      for (let c = 8; c < this.cols; c += 8) {
        const passage = Math.floor(Math.random() * (this.rows - 4)) + 2;
        for (let r = 0; r < this.rows; r++) {
          if (r === passage || r === passage + 1) continue;
          const node = this.grid[r][c];
          if (!node.isStart && !node.isTarget) {
            node.isWall = true;
            node.element.classList.add('node-wall');
          }
        }
      }
    }
  }

  // ==========================================================================
  // Limpeza de Estado
  // ==========================================================================
  clearPath() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const node = this.grid[r][c];
        node.distance = Infinity;
        node.fScore = Infinity;
        node.gScore = Infinity;
        node.isVisited = false;
        node.previousNode = null;
        node.element.classList.remove('node-visited', 'node-shortest-path');
      }
    }
    document.getElementById('metric-visited').textContent = '0';
    document.getElementById('metric-length').textContent = '0';
    document.getElementById('metric-cost').textContent = '0';
    document.getElementById('metric-time').textContent = '0 ms';
  }

  clearAll() {
    this.clearPath();
    this.hasRunOnce = false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const node = this.grid[r][c];
        node.isWall = false;
        node.isWeight = false;
        node.weight = 1;
        node.element.classList.remove('node-wall', 'node-weight');
      }
    }
  }

  updateInfoPanel(algoKey) {
    const info = ALGO_DETAILS[algoKey];
    if (!info) return;

    document.getElementById('info-title').textContent = info.title;
    document.getElementById('info-desc').innerHTML = info.desc;
    document.getElementById('info-time-comp').textContent = info.timeComp;
    document.getElementById('info-space-comp').textContent = info.spaceComp;
    document.getElementById('info-weights').textContent = info.weights;

    const guaranteeBadge = document.getElementById('info-guarantee');
    if (info.guarantee) {
      guaranteeBadge.className = 'guarantee-badge yes';
      guaranteeBadge.textContent = '✓ Garante Menor Caminho';
    } else {
      guaranteeBadge.className = 'guarantee-badge no';
      guaranteeBadge.textContent = '✗ Não Garante Menor Caminho';
    }
  }
}

// Inicializar na carga do documento
document.addEventListener('DOMContentLoaded', () => {
  new PathfindingGrid();
});
