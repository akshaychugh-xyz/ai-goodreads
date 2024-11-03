import React from 'react';

const DemoBanner = ({ onExit }) => {
    return (
        <div className="sticky top-0 z-50 bg-leather text-paper py-2">
            <div className="max-w-2xl mx-auto px-4 flex items-center justify-center space-x-4">
                <span className="font-serif">
                    🎮 Demo Mode: Exploring with sample data
                </span>
                <button 
                    onClick={() => onExit()}
                    className="px-3 py-1 bg-paper/20 hover:bg-paper/30 rounded-lg text-sm transition-colors"
                >
                    Import Your Own Books
                </button>
            </div>
        </div>
    );
};

export default DemoBanner;