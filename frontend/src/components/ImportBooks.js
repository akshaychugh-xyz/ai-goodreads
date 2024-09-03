import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Upload, Check } from 'lucide-react'

const ImportBooks = ({ onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dataPresent, setDataPresent] = useState(false);

    useEffect(() => {
        checkDataPresence();
    }, []);

    const checkDataPresence = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/shelf-counts');
            const hasData = Object.keys(response.data).length > 0;
            setDataPresent(hasData);
            if (hasData) {
                onImportComplete(); // Notify parent component that data is present
            }
        } catch (error) {
            console.error('Error checking data presence:', error);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleImport = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setImporting(true);
        setProgress(0);
        try {
            await axios.post('http://localhost:3001/api/import-books', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
            });
            await checkDataPresence(); // Re-check data presence after import
            onImportComplete();
        } catch (error) {
            console.error('Error importing books:', error);
        }
        setImporting(false);
    };

    return (
        <Card className="mb-6 overflow-hidden bg-white/10">
            <CardHeader className="relative z-10">
                <div className="flex items-center justify-between text-white mb-2">
                    <div className="flex items-center space-x-2">
                        <Upload className="h-6 w-6" />
                        <CardTitle className="text-2xl font-bold">Import Your Books</CardTitle>
                    </div>
                    {dataPresent && <Check className="h-6 w-6 text-green-500" />}
                </div>
            </CardHeader>
            <CardContent className="relative z-10 text-white">
                <div className="flex flex-col items-center space-y-4">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".csv"
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-purple-700 hover:file:bg-purple-100"
                    />
                    <Button onClick={handleImport} disabled={!file || importing} className="w-full bg-white text-purple-700 hover:bg-purple-100">
                        {importing ? 'Importing...' : 'Import Books'}
                    </Button>
                    {importing && (
                        <Progress value={progress} className="w-full" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ImportBooks;