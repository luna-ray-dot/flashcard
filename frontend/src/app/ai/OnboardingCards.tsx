"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";

type OnboardingData = {
  name?: string;
  age?: string;
  school?: string;
  field?: string;
  learningSpeed?: "fast" | "average" | "slow";
};

type OnboardingCard = {
  question: string;
  key: keyof OnboardingData;
  options?: string[];
};

const onboardingCards: OnboardingCard[] = [
  { question: "What's your name?", key: "name" },
  { question: "How old are you?", key: "age" },
  { question: "Which school do you attend?", key: "school" },
  { question: "What's your field of study?", key: "field" },
  {
    question: "How would you describe your learning speed?",
    key: "learningSpeed",
    options: ["fast", "average", "slow"],
  },
];

export default function OnboardingCards({ userId }: { userId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingData>({});

  const currentCard = onboardingCards[currentIndex];

  const handleNext = async () => {
    if (!answers[currentCard.key]) {
      toast.error("Please answer the question before proceeding");
      return;
    }

    if (currentIndex + 1 < onboardingCards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Save onboarding data
      try {
        const res = await fetch(`/api/users/onboarding/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answers),
        });
        if (res.ok) {
          toast.success("Welcome! Your profile is ready 🎉");
        } else {
          toast.error("Failed to save onboarding data");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error connecting to the server");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col space-y-4">
        <h2 className="text-lg font-bold">{currentCard.question}</h2>

        {currentCard.options ? (
          <div className="flex space-x-2">
            {currentCard.options.map((opt) => (
              <button
                key={opt}
                onClick={() =>
                  setAnswers((prev) => ({ ...prev, [currentCard.key]: opt }))
                }
                className={`px-4 py-2 rounded border ${
                  answers[currentCard.key] === opt
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={answers[currentCard.key] || ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [currentCard.key]: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        )}

        <button
          onClick={handleNext}
          className="self-end px-4 py-2 bg-blue-500 text-white rounded"
        >
          {currentIndex + 1 === onboardingCards.length ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
