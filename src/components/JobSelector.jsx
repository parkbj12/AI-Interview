import React from "react";

const JobSelect = ({ onSelectJob }) => {
  const jobs = ["프론트엔드", "백엔드", "데이터 분석", "AI 개발"];

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>👋 모의면접 시작하기</h1>
      <p>직군을 선택해주세요</p>
      {jobs.map((job) => (
        <button
          key={job}
          onClick={() => onSelectJob(job)}
          style={{
            margin: "10px",
            padding: "10px 20px",
            fontSize: "18px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {job}
        </button>
      ))}
    </div>
  );
};

export default JobSelect;

