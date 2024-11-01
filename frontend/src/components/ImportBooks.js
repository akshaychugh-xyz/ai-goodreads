import React, { useState, useRef } from 'react';
import { api } from '../api/api';

const ImportBooks = ({ onImportComplete, hasImportedData, importSectionExpanded }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Create a ref for the file input
    const fileInputRef = useRef(null);

    // Handle the browse button click
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    // Handle file selection
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            handleFileUpload(file);
        }
    };

    // Handle file upload
    const handleFileUpload = async (file) => {
        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.importBooks(formData);
            
            // Call onImportComplete with the response data
            onImportComplete(response);
            
            setUploadSuccess(true);
            setSelectedFile(null);
        } catch (error) {
            console.error('Error uploading file:', error);
            setError('Failed to import books. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-8">
            <p className="font-serif text-wood mb-4">
                {hasImportedData 
                    ? "Want to update your library? Follow these steps:"
                    : "Get started by importing your Goodreads library:"}
            </p>
            
            <div className="space-y-6">
                <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-leather text-paper flex items-center justify-center font-serif">1</div>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <span className="font-serif text-wood">Go to Goodreads and export your library</span>
                            <a 
                                href="https://www.goodreads.com/review/import" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-leather text-paper font-serif text-sm rounded-lg hover:bg-wood transition-colors"
                            >
                                Open Goodreads
                            </a>
                        </div>
                        <p className="text-sm text-wood-dark mt-2">
                            Visit the Goodreads Import/Export page to access your library data. Click on 'Export Library' and wait. This may take 3-7 minutes depending on your library size.
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-leather text-paper flex items-center justify-center font-serif">2</div>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <span className="font-serif text-wood">Upload CSV to get started</span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".csv"
                                className="hidden"
                            />
                            <button
                                onClick={handleBrowseClick}
                                disabled={isUploading}
                                className="px-4 py-2 bg-leather text-paper font-serif text-sm rounded-lg hover:bg-wood transition-colors disabled:opacity-50"
                            >
                                {isUploading ? 'Uploading...' : 'Browse...'}
                            </button>
                        </div>
                        {selectedFile && (
                            <p className="text-sm text-wood-dark mt-2">
                                Selected file: {selectedFile.name}
                            </p>
                        )}
                        {error && (
                            <p className="text-sm text-red-500 mt-2">
                                {error}
                            </p>
                        )}
                        {uploadSuccess && importSectionExpanded && (
                            <p className="text-sm text-green-600 mt-2">
                                Books imported successfully!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportBooks;
