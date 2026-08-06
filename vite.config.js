import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Project-repo GitHub Pages deploy: site lives at
  // https://<username>.github.io/muidsi-quantum-hackathon/, not at root.
  base: '/muidsi-quantum-hackathon/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // three + drei are large; raise the warning ceiling and split the 3D layer out.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
        },
      },
    },
  },
});
