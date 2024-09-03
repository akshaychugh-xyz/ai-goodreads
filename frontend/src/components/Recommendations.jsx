import React, { useState, useEffect } from 'react';
import { fetchRecommendations, fetchShelfCounts } from '../services/api';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { ScrollArea } from "../components/ui/scroll-area"
import { Skeleton } from "../components/ui/skeleton"
import { BookOpen, ChartPie, List } from 'lucide-react'

ChartJS.register(ArcElement, Tooltip, Legend);

const Recommendations = ({ shouldRefresh, setShouldRefresh, onImportComplete }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [shelfCounts, setShelfCounts] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getShelfCounts();
        if (shouldRefresh) {
            getRecommendations();
            setShouldRefresh(false);
        }
    }, [shouldRefresh, setShouldRefresh]);

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
        if (readBooks > 500) return "🧙‍️ Book Sensei";
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(shelfCounts).length > 0 && (
                    <Card className="overflow-hidden bg-white/10">
                        <CardHeader className="relative z-10">
                            <div className="flex items-center space-x-2 text-white mb-2">
                                <ChartPie className="h-6 w-6" />
                                <CardTitle className="text-2xl font-bold">Your Library Overview</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 text-white">
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
                            <p className="total-books mt-4">
                                Total Books: {Object.values(shelfCounts).reduce((a, b) => a + b, 0)}
                            </p>
                            <p className="profile-name mt-2">
                                Your Reader Profile: <strong>{getProfileName(shelfCounts)}</strong>
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Card className="overflow-hidden bg-white/10 flex flex-col">
                    <CardHeader className="relative z-10">
                        <div className="flex items-center space-x-2 text-white mb-2">
                            <BookOpen className="h-6 w-6" />
                            <CardTitle className="text-2xl font-bold">Book Recommendations</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 text-white flex-grow flex flex-col">
                        <Button 
                            onClick={getRecommendations} 
                            disabled={loading} 
                            className="bg-white text-purple-700 hover:bg-purple-100 mb-4"
                        >
                            {loading ? 'Loading...' : 'Get Recommendations'}
                        </Button>
                        
                        {loading ? (
                            <Skeleton className="flex-grow" />
                        ) : recommendations.length > 0 ? (
                            <div className="flex-grow">
                                <h3 className="text-xl font-semibold mb-2">Your Recommendations</h3>
                                <ScrollArea className="h-[calc(100%-2rem)]">
                                    <ul className="space-y-4">
                                        {recommendations.map((book, index) => (
                                            <li key={index} className="bg-white/10 p-4 rounded-lg">
                                                <h4 className="text-lg font-semibold">{book.title} ({book.number_of_pages} pages)</h4>
                                                <p>Author: {book.author}</p>
                                                <p>Shelf: {book.exclusive_shelf}</p>
                                                {index === 2 && <p className="italic">Lucky Pick!</p>}
                                            </li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            </div>
                        ) : (
                            <p className="text-center">No recommendations yet. Click the button to get started!</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Recommendations;