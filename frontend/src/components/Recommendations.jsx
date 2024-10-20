import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Button } from "./ui/button";
import { ScrollArea } from "../components/ui/scroll-area"
import { Skeleton } from "../components/ui/skeleton"
import { BookOpen, ChartPie, User } from 'lucide-react'

ChartJS.register(ArcElement, Tooltip, Legend);

const Recommendations = ({ shouldRefresh, setShouldRefresh, onImportComplete }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [shelfCounts, setShelfCounts] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (shouldRefresh) {
            getRecommendations();
            getShelfCounts();
            setShouldRefresh(false);
        }
    }, [shouldRefresh, setShouldRefresh]);

    const getShelfCounts = async () => {
        try {
            const counts = await api.fetchShelfCounts();
            console.log('Received shelf counts:', counts);
            setShelfCounts(counts);
        } catch (error) {
            console.error('Error fetching shelf counts:', error);
            console.error('Error details:', error.response?.data || error.message);
        }
    };

    const getRecommendations = async () => {
        setLoading(true);
        try {
            const data = await api.fetchRecommendations();
            console.log('Received recommendations:', data);
            if (Array.isArray(data)) {
                setRecommendations(data);
            } else if (data.message) {
                console.log(data.message);
                setRecommendations([]);
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            console.error('Error details:', error.response?.data || error.message);
            setRecommendations([]);
        }
        setLoading(false);
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
                {Object.keys(shelfCounts).length > 0 ? (
                    <div className="bg-white/10 p-6 rounded-lg shadow-lg flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2 text-white">
                                <ChartPie className="h-6 w-6" />
                                <h2 className="text-2xl font-bold">Your Library Overview</h2>
                            </div>
                            <div className="flex items-center space-x-2 text-white bg-purple-600 px-3 py-1 rounded-full">
                                <User className="h-4 w-4" />
                                <p className="text-sm font-semibold">{getProfileName(shelfCounts)}</p>
                            </div>
                        </div>
                        <div className="text-white text-center mb-4">
                            <p className="text-4xl font-bold">{Object.values(shelfCounts).reduce((a, b) => a + b, 0)}</p>
                            <p className="text-sm uppercase tracking-wide">Total Books</p>
                        </div>
                        <div className="flex-grow flex items-center">
                            <div className="w-1/4 text-white text-center">
                                <p className="text-2xl font-bold">{shelfCounts['read'] || 0}</p>
                                <p className="text-sm">Read</p>
                            </div>
                            <div className="w-1/2">
                                <Pie 
                                    data={prepareChartData(shelfCounts)}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: {
                                                    color: 'white',
                                                    font: { size: 12 }
                                                }
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
                                        },
                                        animation: {
                                            animateScale: true,
                                            animateRotate: true
                                        }
                                    }}
                                />
                            </div>
                            <div className="w-1/4 text-white text-center">
                                <p className="text-2xl font-bold">{shelfCounts['to-read'] || 0}</p>
                                <p className="text-sm">To Read</p>
                            </div>
                        </div>
                        <div className="mt-4 text-white">
                            <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
                            <ul className="space-y-1">
                                <li>Average books per month: {((shelfCounts['read'] || 0) / 12).toFixed(1)}</li>
                                <li>Completion rate: {((shelfCounts['read'] || 0) / (Object.values(shelfCounts).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%</li>
                                <li>Currently reading: {shelfCounts['currently-reading'] || 0}</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/10 p-6 rounded-lg shadow-lg flex items-center justify-center">
                        <p className="text-white text-center">No library data available. Import your books to see your overview.</p>
                    </div>
                )}

                <div className="bg-white/10 p-6 rounded-lg flex flex-col">
                    <div className="flex items-center space-x-2 text-white mb-4">
                        <BookOpen className="h-6 w-6" />
                        <h2 className="text-2xl font-bold">Book Recommendations</h2>
                    </div>
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
                            <h3 className="text-xl font-semibold mb-2 text-white">Your Recommendations</h3>
                            <ScrollArea className="h-[calc(100%-2rem)]">
                                <ul className="space-y-4">
                                    {recommendations.map((book, index) => (
                                        <li key={index} className="bg-white/10 p-4 rounded-lg text-white flex">
                                            {book.cover_url && (
                                                <img src={book.cover_url} alt={book.title} className="w-24 h-36 object-cover mr-4" />
                                            )}
                                            <div>
                                                <h4 className="text-lg font-semibold">{book.title}</h4>
                                                <p>Author: {book.author}</p>
                                                <p>Pages: {book.number_of_pages}</p>
                                                <p>Average Rating: {book.average_rating}</p>
                                                <p>Shelf: {book.exclusive_shelf}</p>
                                                {book.subjects && book.subjects.length > 0 ? (
                                                    <p>Subjects: {book.subjects.join(', ')}</p>
                                                ) : (
                                                    <p>Subjects: Not available</p>
                                                )}
                                                {index === 2 && <p className="italic">Lucky Pick!</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </div>
                    ) : (
                        <p className="text-center text-white">No recommendations yet. Click the button to get started!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recommendations;
