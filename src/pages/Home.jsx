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

// ▼ Big‑Calendar 関連
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// カスタム CSS（行送り・文字サイズなど）
import '../styles/CalendarOverride.css';

// ---- 画像を import（JPG / PNG / AVIF のみ。WebP は使わない） ----
import heroDogJpg from '../assets/images/composite_taller_dog.jpg';               // Hero 背景
import xIcon    from '../assets/images/x-line-icon-communication-chat-message-photo-messenger-video-emoji-publications-subscribers-views-likes-comments-editorial_855332-4749.avif';
import lineIcon from '../assets/images/icons8-line-48-2.png';
import noteIcon from '../assets/images/icon.png';

// ▼ X アイコン
const XIcon = () => (
  <img src={xIcon} alt="X(旧Twitter)" width="24" height="24" />
);

// ▼ LINE アイコン
const LineIcon = () => (
  <img src={lineIcon} alt="LINE" width="24" height="24" />
);

// ▼ Note アイコン
const NoteIcon = () => (
  <img src={noteIcon} alt="Note" width="24" height="24" />
);

// ▼ Hero セクション ─ 背景に JPG を使用
const HeroSection = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '400px',
  position: 'relative',
  backgroundImage: `url(${heroDogJpg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  [theme.breakpoints.down('sm')]: { height: '300px' }
}));

// --- Big‑Calendar ローカライザ
import ja from 'date-fns/locale/ja';
const locales = { ja };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function Home() {
  const [events, setEvents] = useState([]);

  // 削除モーダル・選択イベント
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ① 起動時：イベント取得
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(evt => ({
          ...evt,
          start: new Date(evt.start),
          end: new Date(evt.end)
        }));
        setEvents(mapped);
      })
      .catch(console.error);
  }, []);

  // ② 新規イベント追加
  const handleSelectSlot = async (slotInfo) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('ログインが必要です (管理者のみ編集可能)');
      return;
    }
    const title = window.prompt('新しいイベントのタイトルは？');
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
          Authorization: `Bearer ${token}`
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
        { ...created, start: new Date(created.start), end: new Date(created.end) }
      ]);
    } catch (err) {
      console.error(err);
      alert('イベント追加中にエラー発生');
    }
  };

  // ③ クリック→削除モーダル
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  // モーダル閉じ
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedEvent(null);
  };

  // ④ イベント削除
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('ログインが必要です (管理者のみ編集可能)');
      return;
    }
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '削除に失敗');
        return;
      }
      setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
    } catch (err) {
      console.error(err);
      alert('削除中にエラーが発生');
    }
    handleCloseDeleteModal();
  };

  // ⑤ ドラッグ移動／リサイズ
  const handleEventDropOrResize = async ({ event, start, end, allDay }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('ログインが必要です (管理者のみ編集可能)');
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '移動/リサイズに失敗');
        return;
      }
      setEvents(prev =>
        prev.map(e =>
          e.id === data.id
            ? {
                ...e,
                title: data.title,
                start: new Date(data.start),
                end: new Date(data.end),
                allDay: data.all_day
              }
            : e
        )
      );
    } catch (err) {
      console.error(err);
      alert('移動/リサイズ中にエラー');
    }
  };

  /* ========================= JSX ========================= */
  return (
    <>
      {/* ---------- Hero ---------- */}
      <HeroSection>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)'
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff', p: 2 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
            ゲームカフェ.Levelへようこそ！
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            1000種類以上のボードゲームを取り揃えております。お一人様での相席、グループでのご来店も大歓迎です！
          </Typography>
        </Box>
      </HeroSection>

      {/* ---------- コンセプト ---------- */}
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>当店のコンセプト</Typography>
          <Typography variant="body1">
            ゲームカフェ.Levelは、ボードゲームを通じて人と人とのつながりを大切にする場所です。
          </Typography>
        </Paper>
      </Container>

      {/* ---------- 営業情報 ---------- */}
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>営業情報</Typography>
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

      {/* ---------- リンクボタン集 ---------- */}
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>各種ページリンク</Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button variant="contained" component={RouterLink} to="/menu">メニューを見る</Button>
          </Grid>
          <Grid item>
            <Button variant="contained" component={RouterLink} to="/calendar">設備紹介</Button>
          </Grid>
          <Grid item>
            <Button variant="contained" component={RouterLink} to="/reservation">予約フォーム</Button>
          </Grid>
        </Grid>
      </Container>

      {/* ---------- カレンダー ---------- */}
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>大きなカレンダー</Typography>
        <Paper sx={{ p: 2 }}>
          <div style={{ height: '500px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              draggableAccessor={() => true}
              onEventDrop={handleEventDropOrResize}
              onEventResize={handleEventDropOrResize}
            />
          </div>
        </Paper>
      </Container>

      {/* ---------- アクセス ---------- */}
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>アクセス</Typography>
          <Typography variant="body1">千葉県市川市湊新田2−1−１８ビアメゾンロジェール１０１</Typography>
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

      {/* ---------- SNS アイコン ---------- */}
      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>SNSをフォローしよう！</Typography>
        <Grid container spacing={2}>
          <Grid item>
            <IconButton onClick={() => window.open('https://x.com/GamecafeLevel', '_blank')} color="primary">
              <XIcon />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton onClick={() => window.open('https://lin.ee/pyc6UjM', '_blank')} color="primary">
              <LineIcon />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton onClick={() => window.open('https://note.com/chop0058', '_blank')} color="primary">
              <NoteIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Container>

      {/* ---------- 削除モーダル ---------- */}
      <Dialog open={showDeleteModal} onClose={handleCloseDeleteModal}>
        <DialogTitle>イベント削除確認</DialogTitle>
        <DialogContent>
          {selectedEvent && <Typography>「{selectedEvent.title}」を削除しますか？</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteModal}>戻る</Button>
          <Button color="error" variant="contained" onClick={handleDeleteEvent}>
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Home;