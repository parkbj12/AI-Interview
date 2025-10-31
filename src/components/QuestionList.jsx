import { useState, useEffect } from "react";
import { getQuestions, getFeedback } from "../api/api";

export default function QuestionList({ jobType }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedbacks, setFeedbacks] = useState({});

  useEffect(() => {
    if (jobType) getQuestions(jobType).then(setQuestions);
  }, [jobType]);

  const handleChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleFeedback = async (id, question) => {
    const feedback = await getFeedback(question, answers[id] || "");
    setFeedbacks(prev => ({ ...prev, [id]: feedback }));
  };

  return (
    <div>
      {questions.map(q => (
        <div key={q.id} style={{ marginBottom: "20px" }}>
          <div><b>질문:</b> {q.question}</div>
          <textarea
            placeholder="답변 작성..."
            value={answers[q.id] || ""}
            onChange={(e) => handleChange(q.id, e.target.value)}
          />
          <button onClick={() => handleFeedback(q.id, q.question)}>AI 피드백 받기</button>
          {feedbacks[q.id] && (
            <div style={{ marginTop: "10px", color: "green" }}>
              <b>AI 피드백:</b> {feedbacks[q.id]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
