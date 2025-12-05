// src/pages/CategoryPage.jsx
import React, { useState, useEffect } from 'react'

function CategoryPage() {
  const [usedCategories, setUsedCategories] = useState([])
  // ↑ 既に1日1回使用済みのカテゴリ

  // 6カテゴリ順序
  const categories = ['heavy', 'light', 'quiz', 'party', 'stealth', 'gamble']

  useEffect(() => {
    // マウント時に userinfo を取得し、
    // サーバー側で1日1回使用済みかどうかをフロントで把握する方法は幾つかある:
    // 1) 単に何もせずボタン押下時に弾く
    // 2) サーバーで"which categories used"エンドポイントを作る
    // ここではボタン押下時に都度確認するでOK =>
    // ただしフロントで事前にブロックしたいならサーバーと別にAPIが必要
    // ここでは空で実装 or
    // if you have an API to list used categories, fetch it here
  }, [])

  const handleClick = async (cat) => {
    // もしフロントだけで1日1回ブロックするなら:
    if (usedCategories.includes(cat)) {
      alert(`本日は既に "${cat}" カテゴリを使用済みです`)
      return
    }

    const token = localStorage.getItem('token') // JWT

    if (!token) {
      alert('ログインが必要です')
      return
    }
    try {
      const res = await fetch('/api/gameCategory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category: cat }),
      })
      const data = await res.json()
      if (data.success) {
        alert(`+${data.xpGained} XP (現在${data.newXp}XP) 取得成功!`)
        // フロントでも cat を usedCategories に登録
        setUsedCategories((prev) => [...prev, cat])
      } else {
        // 既に使用済み or エラー
        alert(data.msg || '取得失敗')
        if (data.msg?.includes('already got XP')) {
          // ここで cat を usedCategories に入れるのもあり
          setUsedCategories((prev) => [...prev, cat])
        }
      }
    } catch (err) {
      console.error(err)
      alert('エラー発生')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>カテゴリ選択ページ</h2>
      <p>本日は既に使用済みのカテゴリはボタンが無効化されます。</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        {categories.map((cat) => {
          const disabled = usedCategories.includes(cat)
          return (
            <button key={cat} onClick={() => handleClick(cat)} disabled={disabled}>
              {cat}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryPage
