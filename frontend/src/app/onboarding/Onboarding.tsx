import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import './Onboarding.css';

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

const questions = [
  { key: 'name', label: 'What is your name?', type: 'text' },
  { key: 'age', label: 'How old are you?', type: 'number' },
  { key: 'school', label: 'Which school do you attend?', type: 'text' },
  { key: 'field', label: 'Your field of study?', type: 'text' },
  { key: 'learningSpeed', label: 'Are you a fast, average, or slow learner?', type: 'text' },
];

const Onboarding: React.FC<OnboardingProps> = ({ userId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers({ ...answers, [questions[currentStep].key]: e.target.value });
  };

  const handleNext = async () => {
    const currentAnswer = answers[questions[currentStep].key];
    if (!currentAnswer) {
      toast.error('Please answer before proceeding');
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit onboarding answers to backend
      try {
        await axios.post(`/users/onboarding/${userId}`, answers);
        toast.success(`Welcome, ${answers.name}!`);
        onComplete();
      } catch (err) {
        console.error('Failed to save onboarding:', err);
        toast.error('Error saving your information. Please try again.');
      }
    }
  };

  return (
    <div className="onboarding-card">
      <Toaster position="top-right" />
      <h2>{questions[currentStep].label}</h2>
      <input
        type={questions[currentStep].type}
        value={answers[questions[currentStep].key] || ''}
        onChange={handleInputChange}
        className="onboarding-input"
      />
      <button onClick={handleNext} className="onboarding-btn">
        {currentStep < questions.length - 1 ? 'Next' : 'Finish'}
      </button>
    </div>
  );
};

export default Onboarding;
