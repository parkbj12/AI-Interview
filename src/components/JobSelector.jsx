import React from 'react';

const JobSelector = ({ selectedJob, onJobChange }) => {
  const jobs = [
    '프론트엔드 개발자',
    '백엔드 개발자',
    '풀스택 개발자',
    '모바일 개발자',
    '데이터 사이언티스트',
    'AI/ML 엔지니어',
    '데브옵스 엔지니어',
    'UI/UX 디자이너',
    '프로덕트 매니저',
    '기획자',
    'QA 엔지니어',
    '보안 엔지니어',
    '클라우드 엔지니어',
    '블록체인 개발자',
    '게임 개발자',
    '임베디드 개발자',
    '시스템 엔지니어',
    '네트워크 엔지니어',
    '데이터 엔지니어',
    '기타',
  ];

  return (
    <div className="job-selector">
      <label htmlFor="job-select">직무 선택</label>
      <select
        id="job-select"
        value={selectedJob}
        onChange={(e) => onJobChange(e.target.value)}
      >
        <option value="">직무를 선택하세요</option>
        {jobs.map((job) => (
          <option key={job} value={job}>
            {job}
          </option>
        ))}
      </select>
    </div>
  );
};

export default JobSelector;

