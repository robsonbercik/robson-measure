07:45:18.898 Running build in Washington, D.C., USA (East) – iad1
07:45:18.899 Build machine configuration: 2 cores, 8 GB
07:45:19.083 Cloning github.com/robsonbercik/robson-measure (Branch: main, Commit: a4ebbf8)
07:45:19.440 Cloning completed: 357.000ms
07:45:20.088 Restored build cache from previous deployment (2QK1zRLkyHpoEhDvtKsLP8arHSFg)
07:45:20.389 Running "vercel build"
07:45:20.814 Vercel CLI 50.1.6
07:45:21.339 Installing dependencies...
07:45:24.405 
07:45:24.405 up to date in 3s
07:45:24.405 
07:45:24.406 29 packages are looking for funding
07:45:24.406   run `npm fund` for details
07:45:24.441 Running "npm run build"
07:45:24.540 
07:45:24.541 > robsonbercik-automeasure@1.0.0 build
07:45:24.541 > vite build
07:45:24.541 
07:45:24.787 --- VITE BUILD DEBUG ---
07:45:24.788 Mode: production
07:45:24.788 API_KEY Length: 39
07:45:24.789 ------------------------
07:45:24.827 [36mvite v6.4.1 [32mbuilding for production...[36m[39m
07:45:24.904 transforming...
07:45:25.837 [32m✓[39m 29 modules transformed.
07:45:25.840 [31m✗[39m Build failed in 978ms
07:45:25.841 [31merror during build:
07:45:25.841 [31mindex.tsx (3:7): "default" is not exported by "App.tsx", imported by "index.tsx".[31m
07:45:25.842 file: [36m/vercel/path0/index.tsx:3:7[31m
07:45:25.842 [33m
07:45:25.842 1: import React from 'react';
07:45:25.842 2: import ReactDOM from 'react-dom/client';
07:45:25.843 3: import App from './App';
07:45:25.843           ^
07:45:25.843 4: 
07:45:25.843 5: const root = ReactDOM.createRoot(document.getElementById('root')!);
07:45:25.844 [31m
07:45:25.844     at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
07:45:25.844     at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
07:45:25.845     at Module.error (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:17022:16)
07:45:25.845     at Module.traceVariable (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:17478:29)
07:45:25.845     at ModuleScope.findVariable (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:15141:39)
07:45:25.846     at Identifier.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:5462:40)
07:45:25.846     at CallExpression.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:2825:28)
07:45:25.846     at CallExpression.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:12172:15)
07:45:25.847     at CallExpression.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:2825:28)
07:45:25.847     at CallExpression.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:12172:15)[39m
07:45:25.869 Error: Command "npm run build" exited with 1
