// src/FileBasedIde.js
import { useState } from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackFileExplorer, 
  SandpackCodeEditor, 
  SandpackPreview 
} from "@codesandbox/sandpack-react";
import { sandpackDark } from "@codesandbox/sandpack-themes";

export default function FileBasedIde({ initialFiles, dependencies, entry }) {
  const [files, setFiles] = useState(initialFiles);
  const [newFileName, setNewFileName] = useState('');

  const handleAddFile = () => {
    if (!newFileName || files[newFileName]) {
      alert('Please enter a unique and valid file name (e.g., /Component.js)');
      return;
    }
    
    setFiles(currentFiles => ({
      ...currentFiles,
      [newFileName]: `// ${newFileName}\n\nexport default function NewComponent() {\n  return <div>New Component</div>;\n}`
    }));

    setNewFileName('');
  };

  return (
    <div className="ide-container">
      <div className="add-file-controls">
        <input 
          type="text" 
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          placeholder="/NewComponent.js"
        />
        <button onClick={handleAddFile}>Add File</button>
      </div>
      
      <SandpackProvider
        files={files}
        customSetup={{
          dependencies: dependencies,
          entry: entry,
        }}
        theme={sandpackDark}
        options={{
          bundlerState: files 
        }}
      >
        <SandpackLayout>
          <SandpackFileExplorer />
          <SandpackCodeEditor closableTabs />
          <SandpackPreview />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}