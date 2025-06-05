import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, Button, Stack, Avatar } from '@mui/material';
import { uploadAvatar, updateProfile } from '../../services/api';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/TokenContext';

export default function ProfileEditDialog({ open, onClose, profile, onSaved }) {
  const { token } = useContext(AuthContext);
  const [bio, setBio] = useState(profile?.bio || '');
  const [preview, setPreview] = useState(
    profile ? `/api/users/${profile.id}/avatar?${Date.now()}` : null
  );
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (file) {
        // 画像を先にアップロード（DB の avatar 列に保存される）
        const up = await uploadAvatar(token, file);
        if (!up.success) throw new Error(up.error || 'アップロード失敗');
      }
      // bio だけ更新
      const res = await updateProfile(token, { bio });
      if (!res.success) throw new Error(res.error || '更新失敗');

      onSaved(res); // MyPage に反映
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
      if (!open) {
        setFile(null);
        setPreview(profile ? `/api/users/${profile.id}/avatar?${Date.now()}` : null);
        setBio(profile?.bio || '');
        setErr('');
        setLoading(false);
      }
  }, [open, profile]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>プロフィール編集</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt:1 }}>
          <Avatar src={preview} sx={{ width:80, height:80 }} imgProps={{ referrerPolicy: 'no-referrer' }} />
          <Button variant="outlined" component="label">
            画像を選択
            <input type="file" hidden accept="image/*" onChange={handleFile} />
          </Button>
          <TextField
            label="自己紹介 (200文字以内)"
            fullWidth
            multiline
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0,200))}
          />
        </Stack>
        {err && <p style={{ color:'red', marginTop:8 }}>{err}</p>}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onClose} disabled={loading}>キャンセル</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            保存
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}