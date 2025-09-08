import React from 'react';
import { AGE_GROUPS, THEMES } from '../constants';
import type { AgeGroup, Theme } from '../types';

interface OnboardingScreenProps {
  ageGroup: AgeGroup | null;
  setAgeGroup: (age: AgeGroup) => void;
  theme: Theme | null;
  setTheme: (theme: Theme) => void;
  onStart: () => void;
}

const ThemeIcon: React.FC<{ theme: Theme }> = ({ theme }) => {
  const icons: Record<Theme, JSX.Element> = {
    Fantasy: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a5.5 5.5 0 00-5.45 4.54L3 11h18l-3.55-4.46A5.5 5.5 0 0012 2zM5 12l7 10 7-10H5z" />,
    Space: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22.5L6 16.5l1.5-5.5 4.5 1.5 4.5-1.5L18 16.5l-6 6zM12 2v4.5m-3.37-2.37L12 6l3.37-1.87" />,
    Mystery: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    Animals: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm-5.5-2.5a2 2 0 11-4 0 2 2 0 014 0zm11 0a2 2 0 11-4 0 2 2 0 014 0zm-7.5 8.5a2 2 0 11-4 0 2 2 0 014 0zm4 0a2 2 0 110-4 2 2 0 010 4z" />,
    Superheroes: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L4 5v6c0 5.55 3.58 10.36 8 11.92 4.42-1.56 8-6.37 8-11.92V5l-8-3z M12 12l-1.5 2.5-3-1.5 2 3-2.5 1.5 3.5.5L12 21l1-2.5 3.5-.5-2.5-1.5 2-3-3 1.5L12 12z" />,
    Pirates: <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><circle cx="12" cy="10" r="3" /><path d="M12 13c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z M5 16l-1 2m16-2l1 2m-11-4l-2 4m6-4l2 4" /></g>,
    Dinosaurs: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14c-1.5 2.5-4.5 4-8 4s-6.5-1.5-8-4c0 0 1-5 4-6s5-1 5-1 4 .5 7 3z M8 10V7a2 2 0 012-2h0a2 2 0 012 2v3" />,
    'Magic School': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20v2H6.5A2.5 2.5 0 014 19.5z M4 4.5A2.5 2.5 0 016.5 2H20v2H6.5A2.5 2.5 0 014 4.5z M2 8v8a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2H4a2 2 0 00-2 2z" />,
  };
  return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icons[theme]}</svg>;
};


const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ ageGroup, setAgeGroup, theme, setTheme, onStart }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center space-y-8 transform transition-all hover:scale-105 duration-500">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 tracking-tight">Welcome to Adventure World!</h1>
        <p className="text-lg text-gray-600">Let's create an amazing story together.</p>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-purple-700">First, who is this adventure for?</h2>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {AGE_GROUPS.map((age) => (
              <button
                key={age}
                onClick={() => setAgeGroup(age)}
                className={`px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 ${
                  ageGroup === age
                    ? 'bg-purple-500 text-white shadow-lg scale-110'
                    : 'bg-gray-200 text-gray-700 hover:bg-purple-200'
                }`}
              >
                {age} years
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-teal-700">Now, pick a theme!</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {THEMES.map((th) => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all duration-300 ${
                  theme === th
                    ? 'border-teal-400 bg-teal-50 scale-110 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-teal-200'
                }`}
              >
                <ThemeIcon theme={th} />
                <span className="font-semibold text-gray-800">{th}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={!ageGroup || !theme}
          className="w-full sm:w-auto px-12 py-4 text-xl font-bold text-white bg-green-500 rounded-full shadow-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:scale-100"
        >
          Start Adventure!
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;