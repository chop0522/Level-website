// src/pages/Reservation.jsx
import React, { useState } from 'react';
import { createReservation } from '../services/api';

function Reservation() {
  const [dateTime, setDateTime] = useState('');
  const [people, setPeople] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createReservation({ dateTime, people });
    if (res.success) {
      alert('予約が完了しました！');
    } else {
      alert('予約に失敗しました...');
    }
  };

  return (
    <div className="main-content">
      <h2>予約フォーム</h2>
      <form onSubmit={handleSubmit}>
        <label>
          日時:
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </label>
        <br />
        <label>
          人数:
          <input
            type="number"
            min={1}
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />
        </label>
        <br />
        <button type="submit" className="button-retro">予約する</button>
      </form>
    </div>
  );
}

export default Reservation;