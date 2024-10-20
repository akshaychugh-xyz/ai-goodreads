import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { Check, ExternalLink, Upload as UploadIcon, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { api } from '../api/api';

const ImportBooks = ({ onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [importStatus, setImportStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [userBooks, setUserBooks] = useState([]);

    const checkDataPresence = useCallback(async () => {
        try {
            const shelfCounts = await api.getShelfCounts();
            // Handle the response
        } catch (error) {
            console.error('Error checking data presence:', error);
            // Handle the error (e.g., redirect to login if unauthorized)
        }
    }, []);

    useEffect(() => {
        checkDataPresence();
    }, [checkDataPresence]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setImportStatus(null);
    };

    const handleImport = async () => {
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            setErrorMessage('File size exceeds 50MB limit');
            return;
        }

        setIsUploading(true);
        setUploadStatus('');
        setImportStatus(null);
        setErrorMessage(null);

        console.log('Starting import process');
        console.log('File details:', file);

        try {
            // Step 1: Verify the CSV
            setUploadStatus(25);
            console.log('Verifying CSV');
            const result = await api.verifyGoodreadsCSV(file);
            console.log('CSV verification result:', result);

            if (!result.isValid) {
                throw new Error(result.message || 'The selected file is not a valid Goodreads CSV.');
            }

            // Step 2: Trigger data import on the backend
            setUploadStatus(75);
            console.log('Triggering backend import');
            const response = await api.importBooks(file);
            console.log('Backend import response:', response);

            if (response.message === 'Books imported successfully') {
                console.log(`Imported books. New shelf counts:`, response.shelfCounts);
                setImportStatus('success');
                onImportComplete(response.shelfCounts);
            } else {
                throw new Error('Failed to import books');
            }

            // Step 3: Re-check data presence and update status
            setUploadStatus(100);
            console.log('Checking data presence');
            await checkDataPresence();
        } catch (error) {
            console.error('Error importing books:', error);
            setImportStatus('error');
            setErrorMessage(error.message || 'An error occurred while importing books.');
            console.log('Full error object:', error);
        } finally {
            setIsUploading(false);
            console.log('Import process finished');
        }
    };

    const steps = [
        { icon: ExternalLink, text: "Go to Goodreads and export your library", link: "https://www.goodreads.com/review/import" },
        { icon: UploadIcon, text: "Upload CSV to get started" }
    ];

    const handleTestDbConnection = async () => {
        try {
            const response = await api.testDbConnection();
            console.log('Database connection test:', response);
        } catch (error) {
            console.error('Error testing database connection:', error);
        }
    };

    const handleTestBooks = async () => {
        try {
            const response = await api.testBooks();
            console.log('Test books:', response);
        } catch (error) {
            console.error('Error testing books:', error);
        }
    };

    const handleFetchUserBooks = async () => {
        try {
            const books = await api.getUserBooks();
            setUserBooks(books);
        } catch (error) {
            console.error('Error fetching user books:', error);
        }
    };

    const handleCheckDatabase = async () => {
        try {
            const result = await api.checkDatabase();
            console.log('Database check result:', result);
            alert(`You have ${result.bookCount} books in the database.`);
        } catch (error) {
            console.error('Error checking database:', error);
        }
    };

    const handleCheckSchema = async () => {
        try {
            const result = await api.checkSchema();
            console.log('Database schema:', result);
        } catch (error) {
            console.error('Error checking schema:', error);
        }
    };

    const handleCheckConnection = async () => {
        try {
            const result = await api.checkConnection();
            console.log('Database connection check:', result);
            alert(`Database connection successful. Timestamp: ${result.timestamp}`);
        } catch (error) {
            console.error('Error checking database connection:', error);
            alert('Error checking database connection');
        }
    };

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
            <button onClick={handleTestDbConnection}>Test DB Connection</button>
            <button onClick={handleTestBooks}>Test Books</button>
            <button onClick={handleFetchUserBooks}>Fetch User Books</button>
            <button onClick={handleCheckDatabase}>Check Database</button>
            <button onClick={handleCheckSchema}>Check Schema</button>
            <button onClick={handleCheckConnection}>Check DB Connection</button>
            {userBooks.length > 0 && (
                <div>
                    <h3>User Books (first 100):</h3>
                    <ul>
                        {userBooks.slice(0, 20).map((book) => (
                            <li key={book.id}>{book.title} by {book.author}</li>
                        ))}
                    </ul>
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
