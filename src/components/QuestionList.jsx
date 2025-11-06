import React from 'react';
import QuestionCard from './QuestionCard';

const QuestionList = ({ questions, answers, feedbacks }) => {
  return (
    <div className="question-list">
      {questions.map((question, index) => (
        <QuestionCard
          key={index}
          question={question.text || question}
          answer={answers && answers[index]}
          feedback={feedbacks && feedbacks[index]}
          questionNumber={index + 1}
          totalQuestions={questions.length}
        />
      ))}
    </div>
  );
};

export default QuestionList;

