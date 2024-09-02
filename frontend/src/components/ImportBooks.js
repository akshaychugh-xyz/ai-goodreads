import React, { useState } from 'react';
import axios from 'axios';

const ImportBooks = ({ onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleImport = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setImporting(true);
        try {
            await axios.post('http://localhost:3001/api/import-books', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onImportComplete();
        } catch (error) {
            console.error('Error importing books:', error);
        }
        setImporting(false);
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} accept=".csv" />
            <button onClick={handleImport} disabled={!file || importing}>
                {importing ? 'Importing...' : 'Import Books'}
            </button>
        </div>
    );
};

export default ImportBooks;