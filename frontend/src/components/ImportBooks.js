import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { Upload, Check, ExternalLink, Upload as UploadIcon, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { verifyGoodreadsCSV, replaceDataFolder } from '../services/api';

const ImportBooks = ({ onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dataPresent, setDataPresent] = useState(false);
    const [importStatus, setImportStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

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
        setImportStatus(null);
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        setProgress(0);
        setImportStatus(null);

        try {
            // Step 1: Verify the CSV
            const result = await verifyGoodreadsCSV(file);
            
            if (!result.isValid) {
                setImportStatus('error');
                setErrorMessage(result.message || 'The selected file is not a valid Goodreads CSV.');
                setImporting(false);
                return;
            }

            // Step 2: Replace the contents of the data folder
            await replaceDataFolder(file);

            // Step 3: Re-check data presence and update status
            await checkDataPresence();
            setImportStatus('success');
            onImportComplete();
        } catch (error) {
            console.error('Error importing books:', error);
            setImportStatus('error');
            setErrorMessage(error.message || 'An error occurred while importing books.');
        } finally {
            setImporting(false);
        }
    };

    const steps = [
        { icon: ExternalLink, text: "Go to Goodreads and export your library", link: "https://www.goodreads.com/review/import" },
        { icon: UploadIcon, text: "Upload CSV to get started" }
    ];

    return (
        <div className="mb-6 bg-white/10 rounded-lg shadow-xl p-6 text-white">
            <div className="flex flex-col space-y-8 mb-8">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-500 text-white rounded-full font-bold text-lg shadow-md">
                            {index + 1}
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center space-x-2">
                                <step.icon className="h-6 w-6 text-purple-300" />
                                <p className="text-sm font-medium">{step.text}</p>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 text-purple-300 cursor-help hover:text-purple-200 transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-white text-gray-800 p-3 rounded-md shadow-lg max-w-xs">
                                            <p className="text-xs">{getStepExplanation(index)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            {step.link && (
                                <a href={step.link} target="_blank" rel="noopener noreferrer" className="text-xs mt-2 inline-block px-3 py-1 bg-purple-700 text-white rounded-full hover:bg-purple-600 transition-colors">
                                    Open Goodreads
                                </a>
                            )}
                            {index === 1 && (
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".csv"
                                    className="mt-3 w-full text-xs text-white file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 transition-colors cursor-pointer"
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex flex-col items-center space-y-4">
                <Button 
                    onClick={handleImport} 
                    disabled={!file || importing} 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 py-2 rounded-md shadow-md"
                >
                    {importing ? 'Importing...' : 'Import Books'}
                </Button>
                {importing && <Progress value={progress} className="w-full h-2 bg-purple-200" />}
            </div>
            {importStatus === 'success' && (
                <div className="flex items-center justify-center mt-4 bg-green-500 bg-opacity-20 p-2 rounded-md">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-sm text-green-300">Import successful</span>
                </div>
            )}
            {importStatus === 'error' && (
                <div className="flex items-center justify-center mt-4 bg-red-500 bg-opacity-20 p-2 rounded-md">
                    <span className="text-sm text-red-300">{errorMessage}</span>
                </div>
            )}
        </div>
    );
};

function getStepExplanation(stepIndex) {
    const explanations = [
        "Visit the Goodreads Import / Export page to access your library data. Click on 'Export Library' and wait. This may take 3-7 minutes depending on your library size.",
        "Once downloaded, upload the CSV file here to import your books."
    ];
    return explanations[stepIndex];
}

export default ImportBooks;