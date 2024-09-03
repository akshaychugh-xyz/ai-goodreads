import React, { useState } from 'react';
import HeaderWithValueProp from './components/HeaderWithValueProp';
import ImportBooks from './components/ImportBooks';
import Recommendations from './components/Recommendations';

function App() {
    const [shouldRefresh, setShouldRefresh] = useState(false);

    const handleImportComplete = () => {
        console.log('Import completed successfully');
        setShouldRefresh(true);
    };

    return (
        <div className="App min-h-screen bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500">
            <div className="container mx-auto px-4 py-8">
                <HeaderWithValueProp />
                <ImportBooks onImportComplete={handleImportComplete} />
                <Recommendations 
                    shouldRefresh={shouldRefresh} 
                    setShouldRefresh={setShouldRefresh}
                    onImportComplete={handleImportComplete}
                />
            </div>
        </div>
    );
}

export default App;