
import React from 'react';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ text, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-4 sm:p-5 bg-white border-2 border-blue-200 rounded-xl shadow-md hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
    >
      <p className="text-gray-800 font-semibold text-base sm:text-lg">{text}</p>
    </button>
  );
};

export default ChoiceButton;
