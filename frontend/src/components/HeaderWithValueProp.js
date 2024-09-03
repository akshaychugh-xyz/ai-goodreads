import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { BookOpen, Sparkles, BarChart2, BookHeart } from 'lucide-react'

export default function HeaderWithValueProp() {
  return (
    <Card className="mb-6 overflow-hidden bg-white/10">
      <CardHeader className="relative z-10">
        <div className="flex items-center space-x-2 text-white mb-2">
          <BookOpen className="h-6 w-6" />
          <CardTitle className="text-3xl font-bold">AI-Goodreads</CardTitle>
        </div>
        <CardDescription className="text-xl font-semibold text-purple-100">
          Your Smart Reading Companion
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 text-white">
        <p className="text-lg mb-4">
          Forget the outdated Goodreads experience. AI-Goodreads brings your reading journey into the future with powerful AI-driven insights and recommendations.
        </p>
        <div className="flex space-x-4 mb-8">
          <Button variant="secondary" className="bg-white text-purple-700 hover:bg-purple-100">
            <Sparkles className="mr-2 h-4 w-4" />
            Get Started
          </Button>
          <Button variant="outline" className="text-white border-white hover:bg-white/20">
            Learn More
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="overflow-hidden bg-white/10">
            <CardHeader className="relative z-10">
              <div className="flex items-center space-x-2 text-white mb-2">
                <BarChart2 className="h-6 w-6" />
                <CardTitle className="text-xl font-bold">Reader Profile & Library Stats</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 text-white">
              <p>Gain deep insights into your reading habits and preferences. Visualize your library stats and track your reading progress like never before.</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden bg-white/10">
            <CardHeader className="relative z-10">
              <div className="flex items-center space-x-2 text-white mb-2">
                <BookHeart className="h-6 w-6" />
                <CardTitle className="text-xl font-bold">AI-Powered Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 text-white">
              <p>Discover your next favorite book with our advanced AI recommendation engine. Get personalized suggestions based on your unique reading profile.</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}