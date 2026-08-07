/**
 * Single source of truth for every piece of event copy on the site.
 * Edit here. The UI and the 3D HUD both read from this file.
 */

export const EVENT = {
  title: 'MU QIC Quantum Hackathon Fall Fest',
  subtitle: 'Developing the next generation of quantum applications.',
  host: 'University of Missouri - Columbia',
  org: 'MU Electrical Engineering and Computer Science',
  dateRange: 'October 2nd to October 9th',
  dateShort: 'October 2-9',
  registerUrl: 'https://missouri.yul1.qualtrics.com/jfe/preview/previewId/bfe9a54e-c3f7-40d6-b2da-28aff9587989/SV_cOAOwLdlsFTJDaS?Q_CHL=preview&Q_SurveyVersionID=current',
};

export const CHALLENGES = [
  {
    tag: 'PRIMARY CHALLENGE TEASER',
    title: 'Hardware Optimization & Resource Allocation',
    blurb:
      '',
    points: [
      'Design algorithms for dynamic resource management',
      'Model and mitigate hardware-level noise constraints',
      'Tools to explore: Python, Qiskit/Cirq, and Graph Theory libraries (e.g., NetworkX)',
    ],
    accent: 'gold',
  },
  {
    tag: 'ALTERNATIVE CHALLENGE TEASER',
    title: 'Hybrid Quantum-Classical Intelligence',
    blurb:
      '',
    points: [
      'Build pipelines to encode and process complex datasets',
      'Train parameterized models and benchmark performance',
      'Tools to explore: PennyLane, Qiskit Machine Learning, PyTorch/TensorFlow, and Scikit-learn',
    ],
    accent: 'cyan',
  },
];

export const RESOURCES = [
  {
    name: 'Flyers',
    detail: 'Event details and the challenge briefs with useful links for learning.',
  },
  {
    name: 'Slides',
    detail: 'Material used in our Quantum Learning courses will be provided.',
  },
  {
    name: 'Jupyter Notebooks',
    detail: 'We will provide starting notebooks to help people not familiar with qiskit programming.',
  },
];

export const TUTORIALS = [
  {
    id: '01',
    title: 'Introduction to Quantum Computing',
    blurb:
      'Learn about the basics, such as Qubits, superposition, entanglement, and measurement. You will learn how to view problems from a quantum perspective.',
  },
  {
    id: '02',
    title: 'Qiskit and Circuit Building for Beginners',
    blurb:
      'Build your first circuit, run it on a simulator, and learn to read the output.',
  },
  {
    id: '03',
    title: 'Quantum Hardware and Quantum Circuit Transpilation',
    blurb:
      'Learn about different types of Quantum computers, and how our code transfers to the commands on the hardware.',
  },
  {
    id: '04',
    title: 'Quantum Machine Learning (QML) and Variational Quantum Circuits',
    blurb:
      'Learn what current algorithms are used for QML, and how hybrid HPC and QPU piplines work.',
  },
];

export const SCHEDULE = [
  {
    date: '10/1',
    day: 'Thursday',
    label: 'Info sessions and first tutorials',
    items: [
      'Information sessions',
      'Intro-to-quantum tutorial',
      'Hardware and transpilation tutorial',
    ],
    phase: 'pre',
  },
  {
    date: '10/2',
    day: 'Friday',
    label: 'Opening day',
    items: ['Hackathon starts', 'Opening ceremony'],
    phase: 'start',
  },
  {
    date: '10/3',
    day: 'Saturday',
    label: 'Build day',
    items: ['Hackathon weekend'],
    phase: 'build',
  },
  {
    date: '10/4',
    day: 'Sunday',
    label: 'Build day',
    items: ['Hackathon weekend', 'Coffee hour', 'Quantum videogame lounge'],
    phase: 'build',
  },
  {
    date: '10/5',
    day: 'Monday',
    label: 'Speaker and Q&A',
    items: ['Hackathon Q&A'],
    phase: 'build',
  },
  {
    date: '10/6',
    day: 'Tuesday',
    label: 'Speaker and tutorial',
    items: ['Speaker slot', "Qiskit and circuit building for beginners' tutorial"],
    phase: 'build',
  },
  {
    date: '10/7',
    day: 'Wednesday',
    label: 'Speaker and tutorial',
    items: ['IBM Speaker', 'QML and variational circuits tutorial'],
    phase: 'build',
  },
  {
    date: '10/8',
    day: 'Thursday',
    label: 'Presentations and judging',
    items: ['Present hackathon projects', 'Judging'],
    phase: 'judge',
  },
  {
    date: '10/9',
    day: 'Friday',
    label: 'Quantum Day and awards',
    items: [
      "University of Missouri's Quantum Day event",
      'Hackathon awards ceremony',
      'QIC summer intern poster presentations',
    ],
    phase: 'finale',
  },
];

/**
 * Terminal log program for the HUD attached to the quantum chandelier.
 * Each block types out, holds, then the next block begins.
 * `tone` maps to a color class in HudTerminal.
 */
export const TERMINAL_BLOCKS = [
  // --- Original Blocks ---
  {
    tone: 'cyan',
    lines: [
      '[Q-SYS] Initializing multi-tenant scheduler...',
      '[Q-SYS] Partitioning 127-qubit topology...',
      '[Q-SYS] User A assigned 50 qubits | User B assigned 70 qubits',
      '[Q-SYS] Cross-talk mitigation active. Optimization complete.',
    ],
  },
  {
    tone: 'violet',
    lines: [
      '[Q-SEC] Quantum Key Distribution Protocol: ACTIVE',
      '[Q-SEC] WARNING: Brute-force anomaly detected on critical infrastructure grid.',
      '[Q-SEC] Triggering decoherence on malicious node... Hack isolated and neutralized.',
    ],
  },
  {
    tone: 'gold',
    lines: [
      '[Q-MET] Running Variational Quantum Eigensolver on atmospheric fluid dynamics...',
      '[Q-MET] Qubits initialized. Mapping pressure gradients...',
      '[Q-MET] ALERT: High probability vortex signature. Predicting tornado path...',
    ],
  },
  {
    tone: 'green',
    lines: [
      '[Q-BIO] Protein folding simulation via Quantum Walk algorithm initiated...',
      '[Q-BIO] Analyzing molecular structures... Binding site affinity: 99.9%',
      '[Q-BIO] Isolating mutated cancer cells for precision targeting... Complete.',
    ],
  },

  // --- New Blocks ---
  {
    tone: 'red',
    lines: [
      '[Q-HW] Dilution refrigerator cooling sequence... Base temp at 15 millikelvin.',
      '[Q-HW] Performing T1/T2 coherence calibration sequence...',
      '[Q-HW] ERROR: Cosmic ray interference detected on Qubit 42.',
      '[Q-HW] Initiating dynamical decoupling sequence... State preserved.',
    ],
  },
  {
    tone: 'blue',
    lines: [
      '[Q-MAT] Simulating high-Tc cuprate superconductor electron pairing...',
      '[Q-MAT] Applying Fermi-Hubbard model parameters to 2D lattice...',
      '[Q-MAT] Entanglement topology mapped. Zero electrical resistance state confirmed.',
    ],
  },
  {
    tone: 'amber',
    lines: [
      '[Q-OPT] Quantum Approximate Optimization Algorithm (QAOA) engaged.',
      '[Q-OPT] Processing global supply chain graph: 1.2 billion nodes.',
      '[Q-OPT] Minimizing logistical friction... Optimal routing array generated in 0.4s.',
    ],
  },
  {
    tone: 'magenta',
    lines: [
      '[Q-ML] Loading classical dataset into quantum state vectors (QRAM)...',
      '[Q-ML] Training Quantum Neural Network... Gradient descent converging.',
      '[Q-ML] Generative adversarial network state collapse complete. Pattern identified.',
    ],
  },
  {
    tone: 'crimson',
    lines: [
      '[Q-CRYPT] Initiating Shor\'s Algorithm against target 4096-bit RSA key...',
      '[Q-CRYPT] Quantum Fourier Transform applied. Measuring superposition...',
      '[Q-CRYPT] Prime factors extracted successfully. Decryption key synthesized.',
    ],
  },
  {
    tone: 'teal',
    lines: [
      '[Q-RNG] True quantum randomness extraction protocol running...',
      '[Q-RNG] Sampling vacuum state quantum fluctuations...',
      '[Q-RNG] Absolute entropy seed generated. Injecting into classical hypervisor.',
    ],
  },
];
