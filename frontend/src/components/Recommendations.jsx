import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import LibraryOverview from './LibraryOverview';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { BookOpen, Quote } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const Recommendations = ({ shouldRefresh, setShouldRefresh, onImportComplete, hasImportedData, isDemoMode }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [summary, setSummary] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log('Fetching recommendations...');
            const scrollPosition = window.scrollY;  // Store current scroll position
            const response = await api.getRecommendations(isDemoMode);
            setRecommendations(response || []);
            setShouldRefresh(false);
            // Restore scroll position after state update
            setTimeout(() => window.scrollTo(0, scrollPosition), 0);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            setError('Failed to load recommendations');
        } finally {
            setLoading(false);
        }
    };

    const generateSummary = async () => {
        setSummaryLoading(true);
        try {
            const response = await api.generateUserSummary(isDemoMode);
            setSummary(response.summary);
        } catch (error) {
            console.error('Error generating summary:', error);
            setError('Failed to generate summary');
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (shouldRefresh) {
            fetchData();
        }
    }, [shouldRefresh]);

    if (loading) return <div>Loading recommendations...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="space-y-8">
            {/* Soul Reading Section */}
            <Card className="bg-white/90 backdrop-blur-sm p-6 shadow-md border border-wood/10">
                <CardHeader>
                    <CardTitle className="font-display text-2xl text-ink flex items-center gap-2">
                        <Quote className="w-6 h-6 text-leather" />
                        Discover Your Reading Soul
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <button
                            onClick={generateSummary}
                            disabled={summaryLoading}
                            className="self-start px-6 py-3 bg-leather text-paper font-serif text-sm rounded-lg hover:bg-wood transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <BookOpen className="w-4 h-4" />
                            {summaryLoading ? (
                                <>
                                    <span className="animate-pulse">Analyzing your soul...</span>
                                </>
                            ) : (
                                'Look into your Goodreads\' soul'
                            )}
                        </button>

                        {summary && (
                            <div className="mt-4 space-y-4">
                                <div className="relative p-6 bg-cream/30 rounded-lg border border-wood/10">
                                    {/* Decorative quotes */}
                                    <Quote className="absolute -top-3 -left-3 w-8 h-8 text-leather/20 rotate-180" />
                                    <Quote className="absolute -bottom-3 -right-3 w-8 h-8 text-leather/20" />
                                    
                                    {/* Split the summary into paragraphs */}
                                    {summary.split('\n\n').map((paragraph, index) => (
                                        <p key={index} className="font-serif text-wood leading-relaxed mb-4 last:mb-0">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-burgundy/10 rounded-lg border border-burgundy/20">
                                <p className="text-sm font-serif text-burgundy">
                                    {error}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Library Overview Section */}
            <LibraryOverview isDemoMode={isDemoMode} />

            {/* Book Recommendations Section */}
            <Card className="bg-cream/30">
                <CardHeader>
                    <CardTitle className="font-display text-2xl text-ink">Book Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Grid of recommendation cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                        {recommendations.map((book) => (
                            <a 
                                key={book.book_id} 
                                href={`https://www.goodreads.com/book/show/${book.book_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block p-6 bg-white/50 rounded-lg hover:bg-white/70 transition-colors relative"
                            >
                                <div className="space-y-4">
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                                            ${book.exclusive_shelf === 'read' 
                                                ? 'bg-leather/20 text-leather' 
                                                : 'bg-wood/10 text-wood'}`}
                                        >
                                            {book.exclusive_shelf || 'to-read'}
                                        </div>
                                    </div>

                                    {/* Title and Author */}
                                    <div>
                                        <h3 className="font-serif text-xl text-wood group-hover:text-leather transition-colors">
                                            {book.title}
                                        </h3>
                                        <p className="text-wood/70">By {book.author}</p>
                                    </div>

                                    {/* Length and Rating */}
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div>
                                            <div className="text-xs uppercase tracking-wide text-wood/60">LENGTH</div>
                                            <div className="text-wood">{book.number_of_pages || 0} pages</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wide text-wood/60">RATING</div>
                                            <div className="text-wood">{book.average_rating || 0} ★</div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Refresh button */}
                    <button 
                        onClick={fetchData}
                        className="w-full px-4 py-3 bg-leather text-paper font-serif text-sm rounded-lg hover:bg-wood transition-colors"
                    >
                        Refresh your recommendations
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}

export default Recommendations;

