import React, { useState, useEffect } from 'react';
import HeaderWithValueProp from './components/HeaderWithValueProp';
import ImportBooks from './components/ImportBooks';
import Recommendations from './components/Recommendations';
import Login from './components/Login';
import Register from './components/Register';
import { api } from './api/api';
import UserSummary from './components/UserSummary';
import AuthBackground from './components/AuthBackground';
import DisabledSectionOverlay from './components/DisabledSectionOverlay';
import { ChevronDown } from 'lucide-react';
import LoadingState from './components/LoadingState';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const [hasImportedData, setHasImportedData] = useState(false);
    const [showLogin, setShowLogin] = useState(true);
    const [importSectionExpanded, setImportSectionExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

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

    const handleImportComplete = (response) => {
        if (response?.shelfCounts) {
            setHasImportedData(true);
            setShouldRefresh(prev => !prev);
            setTimeout(() => {
                setImportSectionExpanded(false);
            }, 1000);
        }
    };

    useEffect(() => {
        const checkExistingBooks = async () => {
            try {
                const hasBooks = await api.checkImportedBooks();
                setHasImportedData(hasBooks);
                if (hasBooks) {
                    setImportSectionExpanded(false);
                }
            } catch (error) {
                console.error('Error checking for imported books:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkExistingBooks();
    }, []);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen relative">
                <AuthBackground />
                <div className="relative z-10">
                    <div className="container mx-auto px-4 py-8">
                        <header className="mb-12 text-center fade-in-up">
                            <h1 className="font-display text-5xl text-ink mb-4">
                                Find your next favorite book
                            </h1>
                            <p className="font-serif text-wood text-xl max-w-2xl mx-auto">
                                Just something fun using your never-ending Goodreads library!
                            </p>
                        </header>

                        <main className="max-w-md mx-auto">
                            <div className="relative">
                                <div className={`fade-in-up transition-all duration-300 ${
                                    showLogin ? 'opacity-100 visible' : 'opacity-0 invisible absolute inset-0'
                                }`}>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-wood/10">
                                        <div className="text-center mb-8">
                                            <h2 className="font-display text-3xl text-ink mb-2">Welcome</h2>
                                            <p className="font-serif text-wood">Continue your reading journey</p>
                                        </div>
                                        <Login onLogin={handleLogin} />
                                        <div className="relative my-8">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-wood/10"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="px-4 bg-white/80 text-sm font-serif text-wood">or</span>
                                            </div>
                                        </div>
                                        <p className="text-center font-serif text-wood">
                                            Don't have an account?{' '}
                                            <button 
                                                onClick={() => setShowLogin(false)}
                                                className="text-leather hover:text-wood transition-colors font-medium"
                                            >
                                                Create one here
                                            </button>
                                        </p>
                                    </div>
                                </div>
                                
                                <div className={`fade-in-up transition-all duration-300 ${
                                    !showLogin ? 'opacity-100 visible' : 'opacity-0 invisible absolute inset-0'
                                }`}>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-wood/10">
                                        <div className="text-center mb-8">
                                            <h2 className="font-display text-3xl text-ink mb-2">Join the Journey</h2>
                                            <p className="font-serif text-wood">Discover your next great read</p>
                                        </div>
                                        <Register onRegister={() => {
                                            setIsAuthenticated(true);
                                            checkImportedData();
                                        }} />
                                        <div className="relative my-8">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-wood/10"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="px-4 bg-white/80 text-sm font-serif text-wood">or</span>
                                            </div>
                                        </div>
                                        <p className="text-center font-serif text-wood">
                                            Already have an account?{' '}
                                            <button 
                                                onClick={() => setShowLogin(true)}
                                                className="text-leather hover:text-wood transition-colors font-medium"
                                            >
                                                Sign in here
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <LoadingState />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-paper to-cream">
            <div className="container mx-auto px-4 py-8">
                <header className="mb-12 text-center relative">
                    <div className="absolute right-0 top-0">
                        <button 
                            onClick={handleLogout}
                            className="px-4 py-2 bg-leather text-paper font-serif text-sm rounded-lg hover:bg-wood transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                    <h1 className="font-display text-5xl text-ink mb-4">
                        Find your next favorite book
                    </h1>
                    <p className="font-serif text-wood text-xl max-w-2xl mx-auto">
                        Just something fun using your never-ending Goodreads library!
                    </p>
                </header>

                <main className="space-y-8 max-w-5xl mx-auto">
                    <section className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-wood/10">
                        <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setImportSectionExpanded(!importSectionExpanded)}
                        >
                            <div className="flex flex-col">
                                <h2 className="font-display text-3xl text-ink">
                                    {hasImportedData ? "Import Your Books" : "Import Your Books to Get Started"}
                                </h2>
                                {hasImportedData && !importSectionExpanded && (
                                    <p className="text-sm text-wood-dark mt-2">
                                        ✓ Books Imported Successfully
                                    </p>
                                )}
                            </div>
                            {hasImportedData && (
                                <ChevronDown 
                                    className={`w-6 h-6 text-leather transition-transform duration-300 ${
                                        importSectionExpanded ? 'rotate-180' : ''
                                    }`}
                                />
                            )}
                        </div>
                        <div className={`transition-all duration-300 overflow-hidden ${
                            hasImportedData && !importSectionExpanded ? 'max-h-0' : 'max-h-[1000px] mt-6'
                        }`}>
                            <ImportBooks 
                                onImportComplete={handleImportComplete} 
                                hasImportedData={hasImportedData}
                                importSectionExpanded={importSectionExpanded}
                            />
                        </div>
                    </section>

                    <section className={`bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-wood/10 transition-all duration-300 ${
                        !hasImportedData ? 'opacity-50' : ''
                    }`}>
                        <h2 className="font-display text-3xl text-ink mb-6">Your Recommendations</h2>
                        {hasImportedData ? (
                            <Recommendations 
                                shouldRefresh={shouldRefresh} 
                                setShouldRefresh={setShouldRefresh}
                                onImportComplete={handleImportComplete}
                                hasImportedData={hasImportedData}
                            />
                        ) : (
                            <DisabledSectionOverlay />
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}

export default App;
