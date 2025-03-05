// src/pages/FAQ.jsx
import React, { useState } from 'react';
import { postFaqQuestion } from '../services/api';

function FAQ() {
  const [question, setQuestion] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const res = await postFaqQuestion(question);
    if (res.success) {
      alert('お問い合わせを送信しました！');
      setQuestion('');
    } else {
      alert('送信に失敗しました。');
    }
  };

  return (
    <div className="main-content">
      <h2>FAQ・お問い合わせ</h2>
      <p>よくあるご質問や、お問い合わせを送れます。</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows="5"
          cols="50"
          placeholder="ご質問・お問い合わせ内容を入力してください"
        />
        <br />
        <button type="submit" className="button-retro">送信</button>
      </form>
    </div>
  );
}

export default FAQ;