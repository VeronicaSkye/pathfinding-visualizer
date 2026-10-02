# 🧭 PathFinder Lab — Teoria dos Grafos & Menor Caminho

> Simulador interativo de algoritmos clássicos de busca em grafos e menor caminho (**Dijkstra, A* Search, BFS e DFS**), com gerador de labirintos, suporte a células ponderadas, síntese sonora via Web Audio API e recálculo instantâneo em tempo real.

🎮 **[Acessar Demonstração Online (GitHub Pages)](https://veronicaskye.github.io/pathfinding-visualizer/)**

---

## 🌟 Visão Geral do Projeto

Grafos são a estrutura de dados mais onipresente na Engenharia de Software moderna: desde roteamento de pacotes na Internet e mapeamento de redes sociais, até sistemas de navegação GPS e inteligência artificial de jogos.

Este projeto coloca a **Teoria dos Grafos** em ação visual, permitindo aos estudantes e engenheiros compreenderem a diferença empírica entre algoritmos de força bruta, buscas gulosas e buscas informadas por heurística.

### 🎯 Principais Funcionalidades:
- **4 Algoritmos Clássicos**:
  - ⚡ **A* Search (A-Estrela)**: Busca heurística informada com função de avaliação $f(n) = g(n) + h(n)$ (Distância de Manhattan).
  - 🧭 **Dijkstra**: O algoritmo de menor caminho fundamental da computação, com suporte a arestas ponderadas.
  - 🌊 **Breadth-First Search (BFS)**: Exploração por ondas em fila FIFO que garante o menor caminho em grafos não ponderados.
  - 🐍 **Depth-First Search (DFS)**: Busca profunda com pilha LIFO/recursão, ideal para resolução de labirintos complexos.
- **Min-Heap Personalizada (Priority Queue)**: Implementação de uma fila de prioridade com árvore binária completa (*Min-Heap*) para garantir complexidade logarítmica de inserção e remoção ($\mathcal{O}(\log V)$).
- **Recálculo em Tempo Real**: Arraste os nós de Início (🚀) ou Destino (🎯) após a primeira execução para ver o caminho se recalcular instantaneamente a 60 FPS.
- **Suporte a Pesos de Terreno (Weights)**: Células com custo adicional de locomoção ($+5$), testando se os algoritmos sabem contornar montanhas em vez de atravessá-las cegamente.
- **Geradores de Labirintos**:
  - Divisão Recursiva (câmaras e passagens)
  - Distribuição Aleatória com Densidade Controlada
  - Escada Diagonal
- **Áudio Frequencial Sintetizado**: Feedback auditivo em tempo real via Web Audio API que modula a frequência de acordo com a expansão da fronteira de nós visitados.

---

## 📊 Comparativo Técnico dos Algoritmos

| Algoritmo | Paradigma | Estrutura de Dados | Garante Menor Caminho? | Suporta Pesos? | Complexidade de Tempo |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dijkstra** | Guloso / Relaxamento | Min-Heap | **Sim** | **Sim** | $\mathcal{O}((V + E) \log V)$ |
| **A* Search** | Busca Informada | Min-Heap | **Sim** (se admissível) | **Sim** | $\mathcal{O}(E \log V)$ |
| **BFS** | Nível por Nível | Fila FIFO | **Sim** (não ponderado) | Não | $\mathcal{O}(V + E)$ |
| **DFS** | Profundidade | Pilha LIFO | Não | Não | $\mathcal{O}(V + E)$ |

---

## 🛠️ Tecnologias & Engenharia de Software

- **Vanilla JavaScript ES6+**: Zero frameworks ou bibliotecas externas. Toda a computação de grafos, min-heaps e animações foram criadas do zero.
- **Web Audio API**: Mapeamento dinâmico de frequências senoidais em tempo real para proporcionar imersão sensorial.
- **CSS3 Grid & Micro-Animações**: Células com transições de onda (*ripple effects*) com aceleração via GPU.
- **Design Responsivo & Acessível**: Paleta de alto contraste no tema Cyber-Grid com suporte para telas móveis e desktop.

---

## 🚀 Como Executar Localmente

Não requer instalação de Node.js ou dependências!

1. Clone o repositório:
   ```bash
   git clone https://github.com/VeronicaSkye/pathfinding-visualizer.git
   cd pathfinding-visualizer
   ```

2. Abra o arquivo `index.html` em qualquer navegador moderno.

---

## 💡 Por que este projeto é um destaque para um Estudante de Engenharia de Software?

1. **Estruturas de Dados Avançadas**: A grande maioria dos estudantes usa arrays simples com busca linear ($\mathcal{O}(V)$). Criar uma **Min-Heap binária** do zero demonstra maturidade técnica real.
2. **Pensamento Algorítmico & Otimização**: A implementação do A* com Heurística de Manhattan ilustra o uso de inteligência artificial aplicada à otimização combinatória.
3. **Interatividade & State Management**: O recálculo instantâneo ao arrastar nós exige sincronização perfeita entre a representação matricial do grafo e o DOM.

---

Desenvolvido com 💚 para o ecossistema de Engenharia de Software.
