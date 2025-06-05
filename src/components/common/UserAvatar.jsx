

import React from 'react';
import { Avatar } from '@mui/material';

/**
 * 汎用アバターコンポーネント
 *
 * 画像はバックエンドの新エンドポイント
 *   /api/users/{id}/avatar?{ver}
 * から取得します。キャッシュを確実に切り替えるため、
 * `ver` には Date.now() を渡すのが簡単です。
 *
 * @param {number} id   ユーザーID（必須）
 * @param {number} size 表示サイズ (px) デフォルト 40
 * @param {number} ver  キャッシュバスター デフォルト Date.now()
 * @param {object} sx   MUI sx 追加スタイル
 */
export default function UserAvatar({
  id,
  size = 40,
  ver = Date.now(),
  sx = {},
  ...props
}) {
  const src = id ? `/api/users/${id}/avatar?${ver}` : undefined;

  return (
    <Avatar
      src={src}
      sx={{ width: size, height: size, ...sx }}
      {...props}
    />
  );
}