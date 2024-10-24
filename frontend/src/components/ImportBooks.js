import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { ExternalLink, Upload as UploadIcon, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { api } from '../api/api';

const ImportBooks = ({ onImportComplete, hasImportedData }) => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState(null);
    const [userBooks, setUserBooks] = useState([]);
    const [shelfCounts, setShelfCounts] = useState({});

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
        setImportError(null);
    };

    const handleImport = async () => {
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            setImportError('File size exceeds 50MB limit');
            return;
        }

        setImporting(true);
        setImportError(null);

        console.log('Starting import process');
        console.log('File details:', file);

        try {
            // Step 1: Verify the CSV
            console.log('Verifying CSV');
            const result = await api.verifyGoodreadsCSV(file);
            console.log('CSV verification result:', result);

            if (!result.isValid) {
                throw new Error(result.message || 'The selected file is not a valid Goodreads CSV.');
            }

            // Step 2: Trigger data import on the backend
            console.log('Triggering backend import');
            const response = await api.importBooks(file);
            console.log('Backend import response:', response);

            if (response.message === 'Books imported successfully') {
                console.log(`Imported books. New shelf counts:`, response.shelfCounts);
                onImportComplete(response.shelfCounts);
            } else {
                throw new Error('Failed to import books');
            }

            // Step 3: Re-check data presence and update status
            console.log('Checking data presence');
            await checkDataPresence();
        } catch (error) {
            console.error('Error importing books:', error);
            setImportError(error.message || 'An error occurred while importing books.');
            console.log('Full error object:', error);
        } finally {
            setImporting(false);
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
        <div className="bg-white/10 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Import Your Books</h2>
            {hasImportedData ? (
                <p className="text-white mb-4">You've already imported your books. Want to update your library?</p>
            ) : (
                <p className="text-white mb-4">Get started by importing your Goodreads library:</p>
            )}
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
                {importing && <Progress value={100} className="w-full h-2 bg-purple-200" />}
            </div>
            {importError && (
                <div className="flex items-center justify-center mt-4 bg-red-500 bg-opacity-20 p-2 rounded-md">
                    <span className="text-sm text-red-300">{importError}</span>
                </div>
            )}
            <button onClick={handleTestDbConnection}>Test DB Connection</button>
            <button onClick={handleTestBooks}>Test Books</button>
            <button onClick={handleFetchUserBooks}>Fetch User Books</button>
            <button onClick={handleCheckDatabase}>Check Database</button>
            <button onClick={handleCheckSchema}>Check Schema</button>
            <button onClick={handleCheckConnection}>Check DB Connection</button>
            {userBooks.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-xl font-bold text-white mb-2">Your Imported Books</h3>
                    <ul className="list-disc list-inside text-white">
                        {userBooks.map((book, index) => (
                            <li key={index}>{book.title} by {book.author}</li>
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
