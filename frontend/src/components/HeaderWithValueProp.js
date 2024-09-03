import React from 'react'
import { Button } from "../components/ui/button"
import { BookOpen, Sparkles, BarChart2, BookHeart } from 'lucide-react'

export default function HeaderWithValueProp() {
  return (
    <div className="mb-6 text-white">
      <div className="flex items-center space-x-2 mb-2">
        <BookOpen className="h-8 w-8" />
        <h1 className="text-4xl font-bold">Find your next favorite book</h1>
      </div>
      <p className="text-2xl font-semibold text-purple-200 mb-4">
        <s><i>Your AI-Powered Smart Reading Companion</i></s> 
      </p>
      <p className="text-2xl font-semibold text-purple-200 mb-4">
        <i>Just something fun using your never-ending Goodreads library!</i>
      </p>
      <p className="text-lg mb-6">
        Forget the outdated Goodreads experience. AI-Goodreads brings your reading journey into the future with powerful AI-driven insights and recommendations.
      </p>
      <div className="flex space-x-4 mb-8">
        <Button className="bg-white text-purple-700 hover:bg-purple-100">
          <Sparkles className="mr-2 h-4 w-4" />
          Get Started
        </Button>
        <Button variant="outline" className="text-white border-white hover:bg-white/20">
          Learn More
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 p-6 rounded-lg">
          <div className="flex items-center space-x-2 text-white mb-2">
            <BarChart2 className="h-6 w-6" />
            <h2 className="text-xl font-bold">Reader Profile & Library Stats</h2>
          </div>
          <p>Gain deep insights into your reading habits and preferences. Visualize your library stats and track your reading progress like never before.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg">
          <div className="flex items-center space-x-2 text-white mb-2">
            <BookHeart className="h-6 w-6" />
            <h2 className="text-xl font-bold">AI-Powered Recommendations</h2>
          </div>
          <p>Discover your next favorite book with our advanced AI recommendation engine. Get personalized suggestions based on your unique reading profile.</p>
        </div>
      </div>
    </div>
  )
}