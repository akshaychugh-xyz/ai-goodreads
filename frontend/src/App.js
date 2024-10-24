import React, { useState, useEffect } from 'react';
import HeaderWithValueProp from './components/HeaderWithValueProp';
import ImportBooks from './components/ImportBooks';
import Recommendations from './components/Recommendations';
import Login from './components/Login';
import Register from './components/Register';
import { api } from './api/api';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const [hasImportedData, setHasImportedData] = useState(false);
    const [showLogin, setShowLogin] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            checkImportedData();
        }
    }, []);

    const checkImportedData = async () => {
        try {
            const counts = await api.fetchShelfCounts();
            setHasImportedData(Object.values(counts).some(count => count > 0));
        } catch (error) {
            console.error('Error checking imported data:', error);
        }
    };

    const handleLogin = () => {
        setIsAuthenticated(true);
        checkImportedData();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setHasImportedData(false);
    };

    const handleImportComplete = () => {
        console.log('Import completed successfully');
        setShouldRefresh(true);
        setHasImportedData(true);
    };

    return (
        <div className="App min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800">
            <div className="container mx-auto px-4 py-8 space-y-8">
                <HeaderWithValueProp />
                {!isAuthenticated ? (
                    <div className="max-w-md mx-auto">
                        {showLogin ? (
                            <>
                                <Login onLogin={handleLogin} />
                                <p className="mt-4 text-center text-sm text-gray-300">
                                    Don't have an account?{' '}
                                    <button
                                        onClick={() => setShowLogin(false)}
                                        className="font-medium text-indigo-400 hover:text-indigo-300"
                                    >
                                        Register here
                                    </button>
                                </p>
                            </>
                        ) : (
                            <>
                                <Register onRegister={handleLogin} />
                                <p className="mt-4 text-center text-sm text-gray-300">
                                    Already have an account?{' '}
                                    <button
                                        onClick={() => setShowLogin(true)}
                                        className="font-medium text-indigo-400 hover:text-indigo-300"
                                    >
                                        Login here
                                    </button>
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                            Logout
                        </button>
                        <ImportBooks onImportComplete={handleImportComplete} hasImportedData={hasImportedData} />
                        <Recommendations 
                            shouldRefresh={shouldRefresh} 
                            setShouldRefresh={setShouldRefresh}
                            onImportComplete={handleImportComplete}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
