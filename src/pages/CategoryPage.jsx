fetch('/api/gameCategory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ category: "party" })
  })
  .then(res => res.json())
  .then(data => {
    if(data.success) {
      alert(`+${data.xpGained} XP! 現在XP = ${data.newXp}`);
    } else {
      alert(data.msg || '失敗しました');
    }
  });