import React from 'react';

const LoadingState = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-paper">
            <div className="text-center space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-leather border-t-transparent rounded-full mx-auto"></div>
                <p className="font-serif text-wood">Loading your library...</p>
            </div>
        </div>
    );
};

export default LoadingState;