// src/components/account/AccountSettingsDialog.jsx
import React, { useState, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Button
} from '@mui/material';
import { changePassword, deleteAccount, updateProfile } from '../../services/api';
import { AuthContext } from '../../contexts/TokenContext';

/**
 * アカウント設定ダイアログ
 * - パスワード変更
 * - アカウント削除（退会）
 *
 * props:
 *   open     boolean
 *   onClose  func
 *   onLogout func   // 退会完了時にログアウト & 画面遷移するために親が渡す
 */
export default function AccountSettingsDialog({ open, onClose, onLogout }) {
  const { token, setUserInfo } = useContext(AuthContext);

  const [mode, setMode] = useState('settings'); // settings | confirmDelete
  const [newName, setNewName] = useState('');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setNewName('');
    setOldPw('');
    setNewPw('');
    setConfirmPw('');
    setMsg('');
    setError('');
  };
  // ユーザー名変更
  const handleChangeName = async () => {
    setError('');
    setMsg('');
    if (!newName.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }
    const res = await updateProfile(token, { name: newName.trim() });
    if (res.success) {
      // update global userInfo so UI reflects immediately
      if (setUserInfo) {
        setUserInfo(prev => ({ ...prev, name: newName.trim() }));
      }
      setMsg('ユーザー名を変更しました');
      reset();
      handleClose();            // auto-close after success
    } else {
      setError(res.error || '変更に失敗しました');
    }
  };

  const handleClose = () => {
    setMode('settings');
    reset();
    onClose();
  };

  const handleChangePw = async () => {
    setError('');
    setMsg('');
    if (newPw !== confirmPw) {
      setError('新しいパスワードが一致しません');
      return;
    }
    if (newPw.length < 8) {
      setError('パスワードは 8 文字以上で入力してください');
      return;
    }
    const res = await changePassword(oldPw, newPw, token);
    if (res.success) {
      setMsg('パスワードを変更しました');
      reset();
    } else {
      setError(res.error || '変更に失敗しました');
    }
  };

  const handleDelete = async () => {
    const res = await deleteAccount(token);
    if (res.success) {
      onLogout();
    } else {
      setError(res.error || '退会に失敗しました');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      {mode === 'settings' ? (
        <>
          <DialogTitle>アカウント設定</DialogTitle>
          <DialogContent dividers>
            {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
            {msg && <Typography color="primary" sx={{ mb: 1 }}>{msg}</Typography>}
            {/* ユーザー名変更 */}
            <TextField
              label="新しいユーザー名"
              fullWidth
              margin="dense"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <TextField
              label="現在のパスワード"
              type="password"
              fullWidth
              margin="dense"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
            />
            <TextField
              label="新しいパスワード"
              type="password"
              fullWidth
              margin="dense"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <TextField
              label="新しいパスワード (確認)"
              type="password"
              fullWidth
              margin="dense"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button color="error" onClick={() => setMode('confirmDelete')}>退会する</Button>
            <Button
              variant="outlined"
              onClick={handleChangeName}
              disabled={!newName}
            >
              名前を変更
            </Button>
            <Button onClick={handleClose}>閉じる</Button>
            <Button
              variant="contained"
              onClick={handleChangePw}
              disabled={!oldPw || !newPw || !confirmPw}
            >
              パスワード変更
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle>本当に退会しますか？</DialogTitle>
          <DialogContent dividers>
            <Typography>この操作は取り消せません。データは削除されます。</Typography>
            {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMode('settings')}>キャンセル</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>退会する</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}