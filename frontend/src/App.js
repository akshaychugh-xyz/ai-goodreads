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
import DemoBanner from './components/DemoBanner';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const [hasImportedData, setHasImportedData] = useState(false);
    const [showLogin, setShowLogin] = useState(true);
    const [importSectionExpanded, setImportSectionExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isDemoMode, setIsDemoMode] = useState(false);

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
                const hasBooks = await api.checkImportedBooks(isDemoMode);
                if (hasBooks || isDemoMode) {
                    setHasImportedData(true);
                    setImportSectionExpanded(false);
                }
            } catch (error) {
                console.error('Error checking for imported books:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkExistingBooks();
    }, [isDemoMode]);

    const handleEnterDemoMode = async () => {
        setIsDemoMode(true);
        setHasImportedData(true);
        setImportSectionExpanded(false);
        setShowLogin(false);
        try {
            await Promise.all([
                api.getLibraryStats(true),
                api.getRecommendations(true)
            ]);
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading demo data:', error);
        }
    };

    const handleExitDemoMode = () => {
        setIsDemoMode(false);
        setHasImportedData(false);
        setImportSectionExpanded(true);
        checkImportedData();
    };

    if (!isAuthenticated && !isDemoMode) {
        return (
            <div className="min-h-screen relative">
                <AuthBackground />
                <div className="relative z-10">
                    <div className="container mx-auto px-4 py-8">
                        <header className="mb-12 text-center fade-in-up">
                            <h1 className="font-display text-5xl text-ink mb-4">
                                Turn Your Endless Reading List into Your Next Great Read!
                            </h1>
                            <p className="font-serif text-wood text-xl max-w-2xl mx-auto">
                                Smart recommendations from your existing Goodreads library - so you actually read the books you save
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
                                        <div className="text-center space-y-4">
                                            <button
                                                onClick={handleEnterDemoMode}
                                                className="px-6 py-3 bg-leather/10 text-leather hover:bg-leather/20 font-serif text-sm rounded-lg transition-colors inline-flex items-center gap-2"
                                            >
                                                <span className="text-lg">🎮</span>
                                                Try Demo Mode
                                            </button>
                                            <div>
                                                <span className="text-wood">Don't have an account? </span>
                                                <button
                                                    onClick={() => setShowLogin(false)}
                                                    className="text-leather hover:text-wood transition-colors font-medium"
                                                >
                                                    Create one here
                                                </button>
                                            </div>
                                        </div>
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
                                        <div className="text-center space-y-4">
                                            <button
                                                onClick={handleEnterDemoMode}
                                                className="px-6 py-3 bg-leather/10 text-leather hover:bg-leather/20 font-serif text-sm rounded-lg transition-colors inline-flex items-center gap-2"
                                            >
                                                <span className="text-lg">🎮</span>
                                                Try Demo Mode
                                            </button>
                                            <div>
                                                <span className="text-wood">Already have an account? </span>
                                                <button
                                                    onClick={() => setShowLogin(true)}
                                                    className="text-leather hover:underline font-serif"
                                                >
                                                    Sign in here
                                                </button>
                                            </div>
                                        </div>
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
        <div className="min-h-screen relative">
            <AuthBackground />
            <div className="relative z-10">
                {isDemoMode && <DemoBanner onExit={handleExitDemoMode} isAuthenticated={isAuthenticated} />}
                <div className="container mx-auto px-4 py-8">
                    <header className="mb-12 text-center relative">
                        <div className="absolute right-0 top-0 flex gap-2">
                            {isDemoMode && (
                                <button 
                                    onClick={handleExitDemoMode}
                                    className="px-4 py-2 bg-leather/10 text-leather hover:bg-leather/20 font-serif text-sm rounded-lg transition-colors"
                                >
                                    Exit Demo Mode
                                </button>
                            )}
                            {isAuthenticated ? (
                                <button 
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-leather text-paper font-serif text-sm rounded-lg hover:bg-wood transition-colors"
                                >
                                    Logout
                                </button>
                            ) : (
                                <button 
                                    onClick={() => {
                                        handleExitDemoMode();
                                        setShowLogin(true);
                                    }}
                                    className="px-4 py-2 bg-leather text-paper font-serif text-sm rounded-lg hover:bg-wood transition-colors"
                                >
                                    Login / Register
                                </button>
                            )}
                        </div>
                        <h1 className="font-display text-5xl text-ink mb-4">
                            Find your next favorite book
                        </h1>
                        <p className="font-serif text-wood text-xl max-w-2xl mx-auto">
                            Just something fun using your never-ending Goodreads library!
                        </p>
                    </header>

                    <main className="space-y-8 max-w-5xl mx-auto">
                        <section className={`bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-wood/10 ${
                            isDemoMode ? 'hidden' : ''
                        }`}>
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
                                    onEnterDemoMode={handleEnterDemoMode}
                                    isDemoMode={isDemoMode}
                                />
                            </div>
                        </section>

                        {!hasImportedData && !isDemoMode && (
                            <div className="text-center">
                                <button
                                    onClick={handleEnterDemoMode}
                                    className="px-6 py-3 bg-leather/10 text-leather hover:bg-leather/20 font-serif text-sm rounded-lg transition-colors inline-flex items-center gap-2"
                                >
                                    <span className="text-lg">🎮</span>
                                    Try Demo Mode
                                </button>
                            </div>
                        )}

                        <section className={`bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-wood/10 transition-all duration-300 ${
                            !hasImportedData && !isDemoMode ? 'opacity-50' : ''
                        }`}>
                            <h2 className="font-display text-3xl text-ink mb-6">Your Recommendations</h2>
                            {hasImportedData || isDemoMode ? (
                                <Recommendations 
                                    shouldRefresh={shouldRefresh} 
                                    setShouldRefresh={setShouldRefresh}
                                    onImportComplete={handleImportComplete}
                                    hasImportedData={hasImportedData}
                                    isDemoMode={isDemoMode}
                                />
                            ) : (
                                <DisabledSectionOverlay />
                            )}
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default App;
