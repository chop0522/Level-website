// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// ▼ big-calendar関連 import
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import '../styles/CalendarOverride.css';

// ▼ X(旧Twitter)アイコン (ダミーSVG)
const XIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 4 L20 20 M20 4 L4 20" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// ▼ LINEアイコン (ダミーSVG)
const LineIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" fill="currentColor"/>
    <text x="9" y="16" fill="#fff" fontSize="10" fontWeight="bold">LINE</text>
  </svg>
);

// ▼ Noteアイコン (ダミーSVG)
const NoteIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* シンプルな四角 + N の例 */}
    <rect x="3" y="3" width="18" height="18" fill="currentColor"/>
    <text x="7" y="17" fill="#fff" fontSize="10" fontWeight="bold">Note</text>
  </svg>
);

// ▼ Heroセクション (背景画像)
const HeroSection = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '400px',
  backgroundImage: 'url("https://via.placeholder.com/1200x400?text=Hero+Image")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

// --- Big Calendar localizer (date-fns)
import ja from 'date-fns/locale/ja';
const locales = {
  'ja': ja,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function Home() {
  const [events, setEvents] = useState([]);

  // ▼ 削除用モーダルの開閉状態と、選択されたイベントを管理
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ▼ 1) 起動時: DBからイベント一覧を取得 (GETは認証不要でもOK想定)
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        // DBから返った start/end は string → JS Date に変換
        const mapped = data.map(evt => ({
          ...evt,
          start: new Date(evt.start),
          end: new Date(evt.end)
        }));
        setEvents(mapped);
      })
      .catch(err => console.error(err));
  }, []);

  // ▼ 2) 新規イベント追加
  const handleSelectSlot = async (slotInfo) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("ログインが必要です (管理者のみ編集可能)");
      return;
    }
    const title = window.prompt("新しいイベントのタイトルは？");
    if (!title) return;

    const newEvent = {
      title,
      start: slotInfo.start.toISOString(),
      end: slotInfo.end.toISOString(),
      allDay: false
    };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEvent)
      });
      const created = await res.json();
      if (!res.ok) {
        alert(created.error || 'イベント追加に失敗しました');
        return;
      }
      setEvents(prev => [
        ...prev,
        {
          ...created,
          start: new Date(created.start),
          end: new Date(created.end)
        }
      ]);
    } catch (err) {
      console.error(err);
      alert('イベント追加中にエラー発生');
    }
  };

  // ▼ 3) イベントをクリック → 削除用モーダルを表示
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  // ▼ モーダルを閉じる
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedEvent(null);
  };

  // ▼ 選択中のイベントを削除
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert("ログインが必要です (管理者のみ編集可能)");
      return;
    }
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '削除に失敗');
        return;
      }
      // イベント一覧から削除
      setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
    } catch (err) {
      console.error(err);
      alert('削除中にエラーが発生');
    }
    handleCloseDeleteModal();
  };

  // ▼ 4) ドラッグ移動/リサイズ
  const handleEventDropOrResize = async ({ event, start, end, allDay }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("ログインが必要です (管理者のみ編集可能)");
      return;
    }
    const updated = {
      title: event.title,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: !!allDay
    };
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '移動/リサイズ中に失敗');
        return;
      }
      setEvents(prev => prev.map(e => e.id === data.id ? {
        ...e,
        title: data.title,
        start: new Date(data.start),
        end: new Date(data.end),
        allDay: data.all_day
      } : e));
    } catch (err) {
      console.error(err);
      alert('移動/リサイズ中にエラー');
    }
  };

  return (
    <>
      {/* ----- Hero Section ----- */}
      <HeroSection>
        <Box textAlign="center" sx={{ backgroundColor: 'rgba(0,0,0,0.4)', p: 2 }}>
          <Typography variant="h3" component="h1" sx={{ color: '#fff' }}>
            ゲームカフェ.Levelへようこそ！
          </Typography>
          <Typography variant="h6" sx={{ color: '#fff', mt: 1 }}>
            ここにキャッチコピーなどを表示できます
          </Typography>
        </Box>
      </HeroSection>

      {/* ----- 店舗概要・コンセプト ----- */}
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            当店のコンセプト
          </Typography>
          <Typography variant="body1">
            1000種類以上のボードゲームを取り揃えております。お一人様での相席、グループでのご来店も大歓迎です！
          </Typography>
        </Paper>
      </Container>

      {/* ----- 営業情報 ----- */}
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            営業情報
          </Typography>
          <Typography variant="body2">
            平日 15:00 - 24:00 / 土日祝 13:00 - 24:00 / 定休日：月曜
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            30分300円　4時間パック1,200円　1日パック2,400円　ワンドリンク制<br/>
            貸切プラン　平日2時間20,000円　4時間30,000円<br/>
            　　　　　　土日祝日　9時から12時30分　30,000円　※お時間はご相談ください
          </Typography>
        </Paper>
      </Container>

      {/* ----- リンクボタン集 (メニュー, カレンダー, 予約など) ----- */}
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          各種ページリンク
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="contained" 
              component={RouterLink} 
              to="/menu"
            >
              メニューを見る
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              component={RouterLink}
              to="/calendar"
            >
              イベントカレンダー
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              component={RouterLink}
              to="/reservation"
            >
              予約フォーム
            </Button>
          </Grid>
        </Grid>
      </Container>

      {/* ----- React-Big-Calendarを使った大型カレンダー (編集対応) ----- */}
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          大きなカレンダー
        </Typography>
        <Paper sx={{ p: 2 }}>
          <div style={{ height: '500px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}

              // イベント編集用 (新規, 削除, ドラッグ移動, リサイズ)
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              draggableAccessor={() => true}
              onEventDrop={handleEventDropOrResize}
              onEventResize={handleEventDropOrResize}
            />
          </div>
        </Paper>
        <Typography variant="body2" sx={{ mt: 1 }}>
          クリック(タップ)でイベント詳細→削除確認 / ドラッグ移動 / リサイズが可能です。<br/>
          サーバーAPI (/api/events) とDBを連携してイベントを保存/更新します。
        </Typography>
      </Container>

      {/* ----- アクセス (Google Map埋め込み) ----- */}
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            アクセス
          </Typography>
          <Typography variant="body1">
          　千葉県市川市湊新田2−1−１８ビアメゾンロジェール１０１
          </Typography>
          <Box sx={{ mt: 2 }}>
            <iframe
              title="GoogleMap"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.867767207533!2d139.90914127620368!3d35.6802578300267!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188768af217c7b%3A0x42dc8c85cafabf51!2z44Ky44O844Og44Kr44OV44KnLkxldmVs!5e0!3m2!1sja!2sjp!4v1741783603258!5m2!1sja!2sjp"
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Box>
        </Paper>
      </Container>

      {/* ----- SNSアイコン ----- */}
      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          SNSをフォローしよう！
        </Typography>
        <Grid container spacing={2}>
          {/* X (旧Twitter) */}
          <Grid item>
            <IconButton 
              onClick={() => window.open('https://x.com/GamecafeLevel', '_blank')}
              color="primary"
            >
              <XIcon />
            </IconButton>
          </Grid>
          {/* LINE */}
          <Grid item>
            <IconButton
              onClick={() => window.open('https://lin.ee/pyc6UjM', '_blank')}
              color="primary"
            >
              <LineIcon />
            </IconButton>
          </Grid>
          {/* Note */}
          <Grid item>
            <IconButton
              onClick={() => window.open('https://note.com/あなたのアカウント', '_blank')}
              color="primary"
            >
              <NoteIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Container>

      {/*
        ▼ MUIのDialogを使った削除確認モーダル
        1) showDeleteModal (boolean) で開閉
        2) selectedEvent に選択中イベントを保持
        3) handleDeleteEvent で実際に削除処理
      */}
      <Dialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      >
        <DialogTitle>イベントの削除確認</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Typography>
              「{selectedEvent.title}」を削除しますか？
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedEvent(null);
            }}
          >
            キャンセル
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (!selectedEvent) return;
              const token = localStorage.getItem('token');
              if (!token) {
                alert("ログインが必要です (管理者のみ編集可能)");
                return;
              }
              try {
                const res = await fetch(`/api/events/${selectedEvent.id}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                const data = await res.json();
                if (!res.ok) {
                  alert(data.error || '削除に失敗');
                  return;
                }
                // 成功したら state から削除
                setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
              } catch (err) {
                console.error(err);
                alert('削除中にエラーが発生');
              }
              setShowDeleteModal(false);
              setSelectedEvent(null);
            }}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Home;