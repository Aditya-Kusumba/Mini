// src/CodeRunner.js
import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import FileBasedIde from "./FileBasedIde";
import SqlRunner from "./SqlRunner";
import './CodeRunner.css';

const languageConfig = {
  // --- BACKEND LANGUAGES ---
  python: { type: 'backend', editorLanguage: 'python', defaultCode: 'print("Hello, Python!")' },
  javascript: { type: 'backend', editorLanguage: 'javascript', defaultCode: 'console.log("Hello, Node.js!");' },
  java: { type: 'backend', editorLanguage: 'java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}' },
  cpp: { type: 'backend', editorLanguage: 'cpp', defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!";\n    return 0;\n}' },
  
  // --- SQL ---
  sql: { type: 'sql' },

  // --- FRONTEND / SERVER ENVIRONMENTS ---
  node: {
    type: 'frontend',
    initialFiles: {
      '/index.js': `const express = require('express');\nconst app = express();\nconst port = 3000;\n\napp.get('/', (req, res) => {\n  res.send('<h1>Hello from Express!</h1><p>Your Node.js server is running inside Sandpack.</p>');\n});\n\napp.listen(port, () => {\n  console.log(\`Server listening at http://localhost:\${port}\`);\n});`,
      '/package.json': `{\n  "name": "node-server",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": { "start": "node index.js" },\n  "dependencies": { "express": "latest" } }`,
    },
    dependencies: { "express": "latest" },
    entry: '/index.js',
  },
  react: {
    type: 'frontend',
    initialFiles: {
      '/App.js': `import './styles.css';\n\nexport default function App() {\n  return (\n    <div className="App">\n      <h1>Hello, React!</h1>\n      <h2>Add new components and files!</h2>\n    </div>\n  );\n}`,
      '/index.js': `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\n\nconst root = createRoot(document.getElementById('root'));\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
      '/styles.css': `body { font-family: sans-serif; }`,
      '/public/index.html': `<!DOCTYPE html>\n<html><body><div id="root"></div></body></html>`,
    },
    dependencies: { "react": "latest", "react-dom": "latest" },
    entry: '/index.js',
  },
  vanilla: { type: 'frontend', initialFiles: {/* ... */}, dependencies: {}, entry: '/index.html' },
  angular: { type: 'frontend', initialFiles: {/* ... */}, dependencies: {/* ... */}, entry: '/src/main.ts' },
};

export default function Coderunner() {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState(languageConfig.python.defaultCode);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const currentConfig = languageConfig[selectedLanguage];

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    setOutput("");
    if (languageConfig[newLang].type === 'backend') {
      setCode(languageConfig[newLang].defaultCode);
    }
  };

  const runBackendCode = async () => {
    if (!code.trim()) { setOutput("⚠️ Please write some code first."); return; }
    setLoading(true); setOutput("");

    try {
      // ✅ Use relative URL if you have CRA proxy set, otherwise full URL with /api prefix
      const res = await axios.post("/api/run", { code, language: selectedLanguage });
      setOutput(res.data.output || res.data.error || "✅ Execution finished, no output.");
    } catch (err) {
      console.error("Error running code:", err);
      setOutput("❌ Error running code. Make sure your backend is running and reachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="coderunner-container">
      <header className="coderunner-header">
        <h1>Advanced Code Runner</h1>
        <div className="controls">
          <label>Select Environment: </label>
          <select value={selectedLanguage} onChange={handleLanguageChange}>
            {Object.keys(languageConfig).map(lang => (
              <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
            ))}
          </select>
        </div>
      </header>
      
      <main className="editor-container">
        {currentConfig.type === 'backend' ? (
          <>
            <div className="monaco-wrapper">
              <Editor
                height="50vh"
                theme="vs-dark"
                language={currentConfig.editorLanguage}
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{ fontSize: 14, minimap: { enabled: false } }}
              />
            </div>
            <button onClick={runBackendCode} disabled={loading} className="run-btn">{loading ? "Running..." : "Run Code"}</button>
            <div className="output-container">
              <h3>Output:</h3>
              <pre className="output-box">{output || "Output will appear here..."}</pre>
            </div>
          </>
        ) : currentConfig.type === 'frontend' ? (
          <FileBasedIde
            key={selectedLanguage}
            initialFiles={currentConfig.initialFiles}
            dependencies={currentConfig.dependencies}
            entry={currentConfig.entry}
          />
        ) : (
          <SqlRunner />
        )}
      </main>
    </div>
  );
}
