// src/pages/Calendar.jsx
import React from 'react';

function Calendar() {
  return (
    <div className="main-content">
      <h2>イベントカレンダー</h2>
      <iframe
        src="https://notion.so/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        style={{ width: '100%', height: '600px', border: 'none' }}
        title="Notion Calendar"
      />
    </div>
  );
}

export default Calendar;