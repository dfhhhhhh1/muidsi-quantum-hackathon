/**
 * Single source of truth for every piece of event copy on the site.
 * Edit here. The UI and the 3D HUD both read from this file.
 */

export const EVENT = {
  title: 'MUIDSI Quantum Hackathon Fall Fest',
  subtitle: 'Developing the next generation of quantum applications.',
  host: 'University of Missouri',
  org: 'MU Institute for Data Science and Informatics',
  dateRange: 'October 2nd to October 9th',
  dateShort: 'OCTOBER 2 TO 9',
  registerUrl: '#register',
};

export const CHALLENGES = [
  {
    tag: 'PRIMARY CHALLENGE',
    title: 'Multitenant Scheduler',
    blurb:
      'Send a job to a quantum computer today and you get the whole machine, even if your circuit only needs a handful of its qubits. Everything else sits idle until you are finished. Write a scheduler that runs several users on one processor at the same time.',
    points: [
      'Split a large qubit topology into separate partitions',
      'Fit as many jobs on the machine as you can without losing fidelity',
      'Handle cross-talk where two partitions share a boundary',
    ],
    accent: 'gold',
  },
  {
    tag: 'ALTERNATIVE CHALLENGE',
    title: 'Quantum Classifier',
    blurb:
      'Train a quantum circuit to sort data into categories. You will need to get classical data into a quantum state, tune the circuit against a training set, and then work out whether it actually beats an ordinary classical model on the same problem.',
    points: [
      'Encode classical data as quantum states',
      'Train a variational circuit end to end',
      'Measure it against a classical baseline',
    ],
    accent: 'cyan',
  },
];

export const RESOURCES = [
  {
    name: 'Flyers',
    detail: 'Event details and the challenge briefs, ready to print, post, or hand to a classmate.',
  },
  {
    name: 'Slides',
    detail: 'Every tutorial deck, posted before the session and left up afterwards.',
  },
  {
    name: 'Jupyter Notebooks',
    detail: 'Code you can actually run. Starter circuits, sample data, and worked examples.',
  },
];

export const TUTORIALS = [
  {
    id: '01',
    title: 'Introduction to Quantum Computing',
    blurb:
      'Qubits, superposition, entanglement, and measurement. What the terms mean, and why a quantum computer can do things your laptop cannot.',
  },
  {
    id: '02',
    title: 'Qiskit and Circuit Building for Beginners',
    blurb:
      'Build your first circuit, run it on a simulator, and learn to read the histogram that comes back.',
  },
  {
    id: '03',
    title: 'Quantum Hardware and Quantum Circuit Transpilation',
    blurb:
      'What the machines are actually made of, and why the circuit that runs is never quite the circuit you wrote.',
  },
  {
    id: '04',
    title: 'Quantum Machine Learning (QML) and Variational Quantum Circuits',
    blurb:
      'Circuits with parameters you can tune, the cost function you tune them against, and the classical optimizer doing the tuning.',
  },
];

export const SCHEDULE = [
  {
    date: '10/1',
    day: 'Wednesday',
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
    day: 'Thursday',
    label: 'Opening day',
    items: ['Hackathon starts', 'Opening ceremony'],
    phase: 'start',
  },
  {
    date: '10/3',
    day: 'Friday',
    label: 'Build day',
    items: ['Hackathon weekend'],
    phase: 'build',
  },
  {
    date: '10/4',
    day: 'Saturday',
    label: 'Build day',
    items: ['Hackathon weekend', 'Coffee hour', 'Quantum videogame lounge'],
    phase: 'build',
  },
  {
    date: '10/5',
    day: 'Sunday',
    label: 'Speaker and Q&A',
    items: ['Speaker slot', 'Hackathon Q&A'],
    phase: 'build',
  },
  {
    date: '10/6',
    day: 'Monday',
    label: 'Speaker and tutorial',
    items: ['Speaker slot', "Qiskit and circuit building for beginners' tutorial"],
    phase: 'build',
  },
  {
    date: '10/7',
    day: 'Tuesday',
    label: 'Speaker and tutorial',
    items: ['Speaker slot', 'QML and variational circuits tutorial'],
    phase: 'build',
  },
  {
    date: '10/8',
    day: 'Wednesday',
    label: 'Presentations and judging',
    items: ['Present hackathon projects', 'Judging'],
    phase: 'judge',
  },
  {
    date: '10/9',
    day: 'Thursday',
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
];
