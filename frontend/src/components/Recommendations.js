import React, { useState, useEffect } from 'react';
import { fetchRecommendations, fetchShelfCounts } from '../services/api';
import ImportBooks from './ImportBooks';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Recommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [shelfCounts, setShelfCounts] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getShelfCounts();
    }, []);

    const getShelfCounts = async () => {
        try {
            const counts = await fetchShelfCounts();
            setShelfCounts(counts);
        } catch (error) {
            console.error('Error fetching shelf counts:', error);
        }
    };

    const getRecommendations = async () => {
        setLoading(true);
        try {
            const data = await fetchRecommendations();
            setRecommendations(data);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        }
        setLoading(false);
    };

    const handleImportComplete = () => {
        getRecommendations();
        getShelfCounts();
    };

    const prepareChartData = (shelfCounts) => {
        const filteredCounts = Object.entries(shelfCounts).filter(([shelf]) => shelf !== 'currently-reading');
        const labels = filteredCounts.map(([shelf]) => shelf);
        const data = filteredCounts.map(([, count]) => count);
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ];

        return {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                hoverBackgroundColor: colors.slice(0, labels.length)
            }]
        };
    };

    const getProfileName = (shelfCounts) => {
        const totalBooks = Object.values(shelfCounts).reduce((a, b) => a + b, 0);
        const readBooks = shelfCounts['read'] || 0;
        const toReadBooks = shelfCounts['to-read'] || 0;
        const currentlyReading = shelfCounts['currently-reading'] || 0;
        const readPercentage = (readBooks / totalBooks) * 100;
        const toReadPercentage = (toReadBooks / totalBooks) * 100;

        if (readBooks > 1000) return "🏆 Literary Titan";
        if (readBooks > 500) return "🧙‍♂️ Book Sensei";
        if (readPercentage < 5 && toReadPercentage > 90) return "💭 Bibliophile Dreamer";
        if (readPercentage < 10 && toReadPercentage > 80) return "🗄️ Book Hoarder";
        if (readPercentage > 90) return "🐛 Bookworm Extraordinaire";
        if (readPercentage > 80) return "🦈 Voracious Reader";
        if (currentlyReading > 10) return "🐙 Octopus Reader";
        if (currentlyReading > 5) return "🤹 Multitasking Bookworm";
        if (readBooks < 10 && toReadBooks > 200) return "🚀 Ambitious Novice";
        if (readBooks < 10 && toReadBooks > 100) return "🌱 Aspiring Bibliophile";
        if (readPercentage > 40 && readPercentage < 60) return "⚖️ Balanced Bookworm";
        if (readBooks > 100 && readPercentage < 30) return "🐢 Slow and Steady Reader";
        if (toReadBooks === 0 && readBooks > 0) return "🏁 Completionist";
        if (readBooks === 0 && toReadBooks > 50) return "🌠 Wishful Thinker";
        if (totalBooks > 1000 && readPercentage < 20) return "🏛️ Library Curator";
        if (readBooks > 50 && currentlyReading === 0 && toReadBooks === 0) return "🧘 Satisfied Scholar";
        if (readPercentage > 70 && toReadPercentage < 10) return "⚡ Efficient Bookworm";
        if (readBooks > 100 && toReadBooks < 10) return "🔍 Selective Reader";
        if (Object.keys(shelfCounts).length > 5) return "🦘 Genre Jumper";
        return "🧭 Book Explorer";
    };

    return (
        <div>
            <h1>Book Recommendations</h1>
            <ImportBooks onImportComplete={handleImportComplete} />
            <button onClick={getRecommendations} disabled={loading}>
                {loading ? 'Loading...' : 'Get Recommendations'}
            </button>
            {Object.keys(shelfCounts).length > 0 && (
                <div className="library-overview">
                    <h2>Your Library Overview</h2>
                    <div className="chart-container">
                        <Pie 
                            data={prepareChartData(shelfCounts)}
                            options={{
                                plugins: {
                                    legend: {
                                        position: 'right',
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                const label = context.label || '';
                                                const value = context.parsed || 0;
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = ((value / total) * 100).toFixed(1);
                                                return `${label}: ${value} (${percentage}%)`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                    <p className="total-books">
                        Total Books: {Object.values(shelfCounts).reduce((a, b) => a + b, 0)}
                    </p>
                    <p className="profile-name">
                        Your Reader Profile: <strong>{getProfileName(shelfCounts)}</strong>
                    </p>
                </div>
            )}
            {recommendations.length > 0 && (
                <div>
                    <h2>Your Recommendations:</h2>
                    <ul>
                        {recommendations.map((book, index) => (
                            <li key={index}>
                                <h3>{book.title} ({book.number_of_pages} pages)</h3>
                                <p>Author: {book.author}</p>
                                <p>Shelf: {book.exclusive_shelf}</p>
                                {index === 2 && <p><em>Lucky Pick!</em></p>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Recommendations;