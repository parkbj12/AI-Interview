// MongoDB User 모델 스키마 (백엔드에서 사용할 참고용)
// 실제로는 백엔드에서 mongoose 모델로 사용됩니다

export const UserSchema = {
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

export const InterviewSchema = {
  userId: { type: String, required: true, ref: 'User' },
  jobType: { type: String, required: true },
  difficulty: { type: String, required: true },
  questions: [{ 
    id: Number,
    question: String 
  }],
  answers: { type: Object, default: {} },
  feedbacks: { type: Object, default: {} },
  score: { type: Number },
  completedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
};

