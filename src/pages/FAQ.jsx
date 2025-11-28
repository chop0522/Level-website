// src/pages/FAQ.jsx
import React from 'react';
import { 
  Container, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function FAQ() {
  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        よくあるご質問 (FAQ)
      </Typography>

      {/* 1) 料金関連 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">料金関連</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            ・平日30分300円　土日祝日30分400円／平日4時間パック1200円　土日祝日1600円／平日1日パック2400円　土日祝日2800円
          </Typography>
          <Typography variant="body1" paragraph>
            ・ワンドリンク制とは、入店時にソフトドリンク（300円）かアルコール（500円）を
            ご注文いただくシステムです。
          </Typography>
          <Typography variant="body1" paragraph>
            ・貸切プランの料金詳細:
            <br/>　平日2時間20,000円 / 4時間30,000円
            <br/>　土日祝日 9:00 - 12:30 30,000円
            <br/>　※お時間はご相談ください
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 2) 予約方法 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">予約方法</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            ・公式LINE・当サイトの予約フォーム、オープンチャット、X(Twitter)のDM、
            ホットペッパーでご予約が可能です。
          </Typography>
          <Typography variant="body1" paragraph>
            ・当日の飛び込み来店も可能です、席が埋まっている場合はお待ちいただくことがあります。
          </Typography>
          <Typography variant="body1" paragraph>
            ・貸切予約の注意点：
            <br/>　三日前キャンセル料 30% / 二日前 50% / 1日前 80% / 当日 100%
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 3) 飲食関連 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">飲食関連</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            ・食べ物は持ち込み可能ですが、飲み物の持ち込みはNGです。
          </Typography>
          <Typography variant="body1" paragraph>
            ・アルコール提供あり / フードメニューはなし。お持ち込みや隣のインドカレー屋さんや
            Uber Eats等をご利用ください。
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 4) 来店時の注意点 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">来店時の注意点</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            ・小学生までは保護者同伴が必要、中学生のみでの来店は18時までOK
          </Typography>
          <Typography variant="body1" paragraph>
            ・子連れOK / ペットはNG
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 5) ゲーム関連 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">ゲーム関連</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            ・初心者でも安心！スタッフがルール説明いたします。
          </Typography>
          <Typography variant="body1" paragraph>
            ・ゲームが見つからない場合や迷った場合は、店主がおすすめをご紹介。
          </Typography>
          <Typography variant="body1" paragraph>
            ・ゲームの持ち込みは可能。遊びたいゲームの予約も承ります。
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 6) 支払い方法 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">支払い方法</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            ・現金、クレジットカード、電子マネー (iD, QUICPayなど)、
            PayPayなどのQR決済が利用可。
          </Typography>
          <Typography variant="body1" paragraph>
            ・交通系(ICカード)は利用不可。
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 7) 問い合わせ */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">問い合わせ</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            ・その他の問い合わせは公式LINEからお願いします。
            <br/>　<a href="https://lin.ee/pyc6UjM" target="_blank" rel="noopener noreferrer">
              https://lin.ee/pyc6UjM
            </a>
          </Typography>
          <Typography variant="body1" paragraph>
            ・電話: 050-5449-3088（LINE優先）<br/>
              メール: 現在受け付けておりません（LINEへ）
          </Typography>
        </AccordionDetails>
      </Accordion>

    </Container>
  );
}

export default FAQ;