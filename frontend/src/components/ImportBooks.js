import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { Check, ExternalLink, Upload as UploadIcon, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { verifyGoodreadsCSV, replaceDataFolder } from '../services/api';

const ImportBooks = ({ onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [setDataPresent] = useState(false);
    const [importStatus, setImportStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        checkDataPresence();
    }, []);

    const checkDataPresence = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3001/api/shelf-counts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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

        setIsUploading(true);
        setUploadStatus('');
        setImportStatus(null);
        setErrorMessage(null);

        console.log('Starting import process');

        const importTimeout = setTimeout(() => {
            console.log('Import timed out after 5 minutes');
            setIsUploading(false);
            setUploadStatus('error');
            setErrorMessage('Import timed out. Please try again or contact support if the issue persists.');
        }, 300000); // 5 minutes timeout

        try {
            // Step 1: Verify the CSV
            setUploadStatus(25);
            console.log('Verifying CSV');
            const result = await verifyGoodreadsCSV(file);
            console.log('CSV verification result:', result);
            
            if (!result.isValid) {
                throw new Error(result.message || 'The selected file is not a valid Goodreads CSV.');
            }

            // Step 2: Replace the contents of the data folder
            setUploadStatus(50);
            console.log('Replacing data folder');
            const replaceResult = await replaceDataFolder(file);
            console.log('Replace data folder result:', replaceResult);

            // Step 3: Trigger data import on the backend
            setUploadStatus(75);
            console.log('Triggering backend import');
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/api/import-books', formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('Backend import response:', response.data);

            if (response.data.message === 'Books imported successfully') {
                console.log(`Imported ${response.data.totalRows} books, including ${response.data.toReadCount} 'to-read' books`);
                setImportStatus('success');
                onImportComplete();
            } else {
                throw new Error('Failed to import books');
            }

            // Step 4: Re-check data presence and update status
            setUploadStatus(100);
            console.log('Checking data presence');
            await checkDataPresence();
        } catch (error) {
            console.error('Error importing books:', error);
            setImportStatus('error');
            setErrorMessage(error.message || 'An error occurred while importing books.');
            // Log the full error object for debugging
            console.log('Full error object:', error);
        } finally {
            clearTimeout(importTimeout);
            setIsUploading(false);
            console.log('Import process finished');
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
                    disabled={!file || isUploading} 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 py-2 rounded-md shadow-md"
                >
                    {isUploading ? 'Importing...' : 'Import Books'}
                </Button>
                {isUploading && <Progress value={uploadStatus} className="w-full h-2 bg-purple-200" />}
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