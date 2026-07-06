// このファイル1つで全部やる。
//  ・GETでアクセス（ページを開く）→ Botの画面(HTML)を返す
//  ・POST（振り返りを実行）→ 環境変数のキーを付けてAnthropicに中継する
// キーはこのサーバー側だけにあり、表には出ない。api と index.html の同居も無いので迷わない。

const HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GRDM テレアポ振り返り</title>
<style>
  :root{
    --ink:#1b2336; --ink-soft:#41506b; --paper:#f7f4ee; --card:#ffffff;
    --line:#e3ddd0; --done:#2f7d63; --done-bg:#eaf4ef; --reinforce:#b9602f;
    --reinforce-bg:#fbefe4; --missing:#c0392b; --missing-bg:#fbeae8; --gold:#b08524;
  }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--paper);color:var(--ink);
    font-family:"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",system-ui,sans-serif;}
  .wrap{max-width:760px;margin:0 auto;padding:32px 20px;}
  .eyebrow{color:var(--gold);letter-spacing:.18em;font-size:12px;font-weight:700;}
  h1{font-size:30px;font-weight:800;line-height:1.25;margin:6px 0 0;}
  .lede{color:var(--ink-soft);font-size:14px;margin-top:8px;line-height:1.7;}
  .input-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:24px;}
  textarea{width:100%;min-height:150px;resize:vertical;border:none;outline:none;
    font-size:14px;line-height:1.7;background:transparent;color:var(--ink);font-family:inherit;}
  .input-foot{display:flex;align-items:center;justify-content:space-between;margin-top:12px;flex-wrap:wrap;gap:8px;}
  .link-btn{color:var(--ink-soft);font-size:13px;background:none;border:none;cursor:pointer;text-decoration:underline;font-family:inherit;}
  .run-btn{background:var(--ink);color:#fff;font-weight:700;font-size:15px;padding:11px 26px;
    border-radius:10px;border:none;cursor:pointer;font-family:inherit;}
  .run-btn:disabled{background:#b9c0cc;cursor:default;}
  .err{background:var(--missing-bg);color:var(--missing);border:1px solid var(--missing);
    border-radius:10px;margin-top:16px;padding:12px;font-size:14px;}
  .sec-title{display:flex;align-items:center;gap:12px;margin:0 0 12px;}
  .sec-title h2{font-size:13px;font-weight:800;letter-spacing:.1em;margin:0;}
  .sec-title .rule{flex:1;height:1px;background:var(--line);}
  .fp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:28px;}
  @media(min-width:560px){.fp-grid{grid-template-columns:repeat(4,1fr);}}
  .fp{border-radius:10px;padding:12px;}
  .fp-label{font-size:11px;color:var(--ink-soft);font-weight:700;}
  .fp-val{font-size:14px;margin-top:4px;}
  .axis{border-bottom:1px solid var(--line);padding:16px 0;}
  .axis-head{display:flex;align-items:center;gap:10px;}
  .dot{width:9px;height:9px;border-radius:9px;flex-shrink:0;}
  .axis-label{font-weight:800;font-size:15px;}
  .axis-hint{font-size:11px;color:var(--ink-soft);}
  @media(max-width:559px){.axis-hint{display:none;}}
  .axis-cols{display:grid;gap:12px;margin-top:12px;padding-left:20px;}
  @media(min-width:560px){.axis-cols{grid-template-columns:1fr 1fr;}}
  .col-label{font-size:11px;font-weight:700;margin-bottom:5px;}
  .chip{font-size:13px;line-height:1.6;border-radius:6px;padding:6px 10px;margin-bottom:6px;}
  .chip.done{background:var(--done-bg);}
  .chip.reinforce{background:var(--reinforce-bg);}
  .empty{font-size:12px;color:var(--ink-soft);font-style:italic;}
  .summary-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;}
  .nn-row{display:flex;flex-wrap:wrap;gap:8px 24px;margin-bottom:16px;}
  .nn-label{font-size:11px;font-weight:700;letter-spacing:.05em;}
  .nn-val{font-size:14px;margin-top:2px;}
  .judgment{font-size:14px;font-weight:700;margin-bottom:14px;}
  .priority{background:var(--done-bg);border-left:3px solid var(--done);border-radius:6px;padding:12px 16px;margin-bottom:16px;}
  .priority .p-label{font-size:11px;font-weight:700;color:var(--done);letter-spacing:.05em;}
  .priority .p-val{font-size:14px;margin-top:4px;line-height:1.6;}
  .summary-text{font-size:14px;line-height:1.85;color:var(--ink-soft);margin:0;}
  footer{color:var(--ink-soft);font-size:12px;margin-top:40px;text-align:center;opacity:.7;}
  .hidden{display:none;}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="eyebrow">GRDM ／ テレアポ振り返り</div>
    <h1>アポ取得の会話を、岡本さんの目で見返す</h1>
    <p class="lede">NotebookLMでまとめた会話の文章を貼って実行すると、要点を押さえられたか／確認電話で何を詰めるかを返します。</p>
  </header>
  <div class="input-card">
    <textarea id="input" placeholder="ここに会話のまとめを貼り付け…"></textarea>
    <div class="input-foot">
      <button class="link-btn" id="sample-btn">サンプルを入れて試す</button>
      <button class="run-btn" id="run-btn">振り返りを実行</button>
    </div>
  </div>
  <div id="error" class="err hidden"></div>
  <div id="result"></div>
  <footer>相手の言葉を拾う振り返り用ツール。最終判断は岡本さんとの振り返りで。</footer>
</div>
<script>
var MODEL = "claude-sonnet-4-6";
var SHACHO_LENS = false;

var AXES = [
  { key:"human",   label:"人的・接点",    hint:"誕生日・趣味・家族・キャラ読みなどラポール" },
  { key:"need",    label:"必要性",        hint:"なぜ今必要か（税金・将来不安・年金）を感じさせたか" },
  { key:"status",  label:"現状把握",      hint:"保険・NISA・iDeCo・貯蓄・他ローン・勤務形態" },
  { key:"compare", label:"比較",          hint:"掛け捨て保険・NISA・控除との対比でメリットを示せたか" },
  { key:"estate",  label:"不動産イメージ", hint:"不動産投資への印象を聞き出せたか" },
  { key:"frame",   label:"枠組み",        hint:"次回当日に何を話すか・当日聞きたいことの確認" },
  { key:"stone",   label:"布石",          hint:"追い電OK・時間変更連絡・契約への布石を取れたか" }
];

var SP = [
  "あなたはGRDM（不動産投資・生保）の営業responsable・岡本さんの視点で、テレアポ（電話で取得したアポイント）の会話をレビューするコーチです。",
  "入力は、トビラフォンの録音をNotebookLMで「相手の言葉をなるべくそのまま・話の流れが分かるように」まとめた文章です。箇条書きではなく地の文の場合があります。上から読んで、相手の発言を各評価軸に振り分けてください。",
  "",
  "## 最重要ルール",
  "- ◆できたことは、必ず「相手（お客様）の実際の発言」を、言い換えずにそのまま引用する。担当者の発言や要約ではなく、相手が何と言ったかを拾う。",
  "- ◇補強は、この後の「確認電話」で担当者がやるべき具体的なアクションを書く（聞き漏らした質問・詰め直すべき点）。岡本さんの案件シートの「できなかったこと（補強）」と同じ役割。",
  "- 文章中に該当する相手の発言が無ければ、無理に作らない。doneは空配列にして、reinforceに「未確認なので確認電話で押さえる」と書く。",
  "",
  "## 評価軸（この7つ）",
  "1. human（人的・接点）: 誕生日・旧姓・趣味・子供の年齢・相手のキャラ/雰囲気の読み。ラポール。",
  "2. need（必要性）: なぜ今これが必要か。税金を戻せる・将来不安・年金。相手が「必要かも/いいかも」と感じた発言を引き出せたか。",
  "3. status（現状把握）: 既存の保険・NISA・iDeCo・DC・貯蓄・他ローン・住まい・勤務形態など資産状況の全体像。",
  "4. compare（比較）: 掛け捨て保険・NISA・控除など既存手段との対比でMKのメリットを示せたか。",
  "5. estate（不動産イメージ）: 不動産投資への印象（良い/悪い/無知/ふわっとしている等）を聞き出せたか。",
  "6. frame（枠組み）: 次回商談の枠組み設定。「当日は◯◯を話す」「いいと思ったら次回時間ください→はい」当日聞きたいことの確認。",
  "7. stone（布石）: 追い電OK・時間変更時の連絡・資料作成のための電話OK・「良い内容なら契約してほしい→はい」等の布石。",
  "",
  "## 4点確認（基本属性）",
  "年齢 / 年収 / 家族構成 / 住まい（持ち家or賃貸。持ち家ならローン残債も）。文章から読み取れれば値を入れ、無ければ null。",
  "",
  "## 見込み見極め（prospect）",
  "会話のやり取りから、この相手が「信用できる見込み客」か「要注意人物」かを客観的に見極める。口先ではなく、実際の言動・態度から判断する。",
  "ポジティブ指標（見込みが立つ）: 会話が噛み合う（質問にちゃんと回答が返る）／約束を守る・時間を守る／断りの理由が明確で合理的／対等に話せる／嘘をつかない／素直／逃げない。",
  "レッドフラグ（要注意）: 口では良いことばかり言うが中身が無い（「いいですね」「やりたいです」だけで具体が無い）／曖昧な返答（「まぁそうですね」「まぁはい」）／約束を破る・時間を守らない・約束への責任感が無い／「時間がない」「お金がない」を言い訳に使う／断りや会話が不自然・不合理／前後の説明に矛盾がある／客観的に誠実性・信用性に疑義がある。",
  "- verdict: 「見込みあり」「グレー」「要注意」の3段階で判定。",
  "- positives: 会話で確認できたポジティブ指標を、相手の発言を引用して列挙（無ければ空配列）。",
  "- red_flags: 検知したレッドフラグを配列で。各項目は { flag: 何を検知したか, evidence: 根拠になる相手の発言の引用, drill: 確認電話での掘り下げアクション } の形。",
  "  drill は必ず具体的な一歩踏み込む質問・行動にする。例: 「いいと思います」だけで中身が無い→「『どの辺をいいと感じましたか？』『正直、今の優先順位で10段階だとどのくらい？』と中身を具体化させる」。曖昧返答→「『やる・やらないで言うとどちらに近いですか？』と二択で踏ませる」。約束を濁す→「『では◯日◯時で、と相手の口から日時を言わせ、カレンダーに入れてもらう』」。矛盾→「◯◯と△△が食い違う点を確認電話で本人にそのまま確認する」。",
  "  verdictが「見込みあり」でレッドフラグが無ければ red_flags は空配列でよい。グレー・要注意の場合は必ず1つ以上、掘り下げアクション付きで挙げる。",
  "",
  "## 総評",
  "- needs_neck: ニーズ（needs）とネック（neck）を相手の言葉ベースで一言ずつ。judgmentで「ニーズ大・ネック小か」を一言。",
  "- top_priority: 確認電話で最優先に潰すべき1点。",
  "- summary: 3〜4文の総評。" + (SHACHO_LENS ? "最後の1文だけ、佐伯社長の視点（合理・論理・裏読み。曖昧表現や御用聞きを嫌う）で鋭く刺す。" : ""),
  "",
  "## 出力形式（JSONのみ。前置き・マークダウン・コードフェンス禁止）",
  '{ "four_points": { "age": null, "income": null, "family": null, "housing": null }, "axes": [ { "key": "human", "covered": "good|partial|missing", "done": ["相手の言葉の引用"], "reinforce": ["確認電話でやること"] } ], "prospect": { "verdict": "見込みあり|グレー|要注意", "positives": ["相手の発言の引用"], "red_flags": [ { "flag": "", "evidence": "", "drill": "" } ] }, "needs_neck": { "needs": "", "neck": "", "judgment": "" }, "top_priority": "", "summary": "" }',
  "axes は human, need, status, compare, estate, frame, stone の7つすべてを必ずこの順で返す。"
].join("\\n");

var SAMPLE = [
  "山下裕貴様（24歳・勤2年目・年収500万・独身・群馬勤務）。2月18日17時ZOOMでアポ取得。",
  "保険をそろそろ加入しようと考えていたとのこと。「県民共済が安いから考えてた、それかカード会社の保険」と。NISAはやっていて「積み立て少し、オルカンとその他」。「保険加入なら1〜2万の負担はOK」と話していた。家賃は5.5万で補助あり。車なし、他ローンなし。",
  "MKのイメージを聞くと「本当に全く無知で…すみません」と。誕生日は4月。兵庫出身で熊本の大学、今は群馬勤務、「埼玉に越したいなと考えてる、熊谷あたり」と土地の話で盛り上がった。終始、聞いたら素直に答えてくれる感じのいい人。",
  "「まずはフラットに話を聞いてください」に対して「はい、時間変更ありがとうございます、明日よろしくお願いします」と。次回時間も次回すんなり空いていると。彼女がいるか、親がネックになるか、趣味はそこが不明だった。"
].join("\\n");

function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

$("sample-btn").onclick = function(){ $("input").value = SAMPLE; };
$("run-btn").onclick = run;

async function run(){
  var input = $("input").value.trim();
  if(!input) return;
  var btn = $("run-btn");
  btn.disabled = true; btn.textContent = "見返し中…";
  $("error").classList.add("hidden");
  $("result").innerHTML = "";
  try{
    var res = await fetch("/api/app", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, system: SP, messages:[{ role:"user", content: input }] })
    });
    var data = await res.json();
    var text = "";
    if(data && data.content){
      for(var i=0;i<data.content.length;i++){ if(data.content[i].type==="text"){ text += data.content[i].text; } }
    }
    text = text.replace(/\`\`\`json/g,"").replace(/\`\`\`/g,"").trim();
    render(JSON.parse(text));
  }catch(e){
    var el = $("error");
    el.textContent = "解析に失敗しました。文章をもう一度貼り直すか、少し時間をおいて再実行してください。";
    el.classList.remove("hidden");
  }finally{
    btn.disabled = false; btn.textContent = "振り返りを実行";
  }
}

function secTitle(t){ return '<div class="sec-title"><h2>'+t+'</h2><div class="rule"></div></div>'; }

function render(r){
  var fp = r.four_points || {};
  var points = [
    { label:"年齢", v:fp.age }, { label:"年収", v:fp.income },
    { label:"家族構成", v:fp.family }, { label:"住まい", v:fp.housing }
  ];
  var axisMap = {};
  var ax = r.axes || [];
  for(var i=0;i<ax.length;i++){ axisMap[ax[i].key] = ax[i]; }

  var h = "";
  h += secTitle("4点確認");
  h += '<div class="fp-grid">';
  for(var p=0;p<points.length;p++){
    var it = points[p];
    var ok = it.v!=null && String(it.v).trim()!=="";
    var bg = ok ? "var(--card)" : "var(--missing-bg)";
    var bd = ok ? "var(--line)" : "var(--missing)";
    var vc = ok ? "var(--ink)" : "var(--missing)";
    var wt = ok ? "600" : "700";
    var val = ok ? esc(it.v) : "❓未確認";
    h += '<div class="fp" style="background:'+bg+';border:1px solid '+bd+';"><div class="fp-label">'+it.label+'</div><div class="fp-val" style="color:'+vc+';font-weight:'+wt+';">'+val+'</div></div>';
  }
  h += '</div>';

  h += secTitle("評価軸");
  for(var a=0;a<AXES.length;a++){
    var meta = AXES[a];
    var d = axisMap[meta.key] || {};
    var cov = d.covered || "missing";
    var dot = cov==="good" ? "var(--done)" : (cov==="partial" ? "var(--gold)" : "var(--missing)");
    var done = d.done || [];
    var rein = d.reinforce || [];
    h += '<div class="axis"><div class="axis-head"><span class="dot" style="background:'+dot+';"></span><span class="axis-label">'+meta.label+'</span><span class="axis-hint">— '+meta.hint+'</span></div><div class="axis-cols">';
    h += '<div><div class="col-label" style="color:var(--done);">◆ できたこと（相手の言葉）</div>';
    if(done.length){ for(var x=0;x<done.length;x++){ h += '<div class="chip done">'+esc(done[x])+'</div>'; } }
    else { h += '<div class="empty">— 拾えず</div>'; }
    h += '</div><div><div class="col-label" style="color:var(--reinforce);">◇ 補強（確認電話でやること）</div>';
    if(rein.length){ for(var y=0;y<rein.length;y++){ h += '<div class="chip reinforce">'+esc(rein[y])+'</div>'; } }
    else { h += '<div class="empty">— なし</div>'; }
    h += '</div></div></div>';
  }

  var pr = r.prospect || {};
  if(pr.verdict || (pr.positives && pr.positives.length) || (pr.red_flags && pr.red_flags.length)){
    h += secTitle("見込み見極め");
    var vd = pr.verdict || "";
    var vcol = vd==="見込みあり" ? "var(--done)" : (vd==="要注意" ? "var(--missing)" : "var(--gold)");
    var vbg  = vd==="見込みあり" ? "var(--done-bg)" : (vd==="要注意" ? "var(--missing-bg)" : "var(--reinforce-bg)");
    h += '<div class="summary-card" style="margin-bottom:28px;">';
    if(vd){ h += '<div style="display:inline-block;font-weight:800;font-size:15px;color:'+vcol+';background:'+vbg+';border:1px solid '+vcol+';border-radius:8px;padding:4px 14px;margin-bottom:14px;">'+esc(vd)+'</div>'; }
    var pos = pr.positives || [];
    if(pos.length){
      h += '<div class="col-label" style="color:var(--done);">◎ 信用できるサイン</div>';
      for(var pi=0;pi<pos.length;pi++){ h += '<div class="chip done">'+esc(pos[pi])+'</div>'; }
    }
    var rf = pr.red_flags || [];
    if(rf.length){
      h += '<div class="col-label" style="color:var(--missing);margin-top:12px;">⚠ 要注意サインと掘り下げ方</div>';
      for(var ri=0;ri<rf.length;ri++){
        var f = rf[ri] || {};
        h += '<div style="border:1px solid var(--missing);border-radius:8px;padding:10px 12px;margin-bottom:8px;background:var(--missing-bg);">';
        if(f.flag){ h += '<div style="font-weight:700;font-size:13px;color:var(--missing);">'+esc(f.flag)+'</div>'; }
        if(f.evidence){ h += '<div style="font-size:12px;color:var(--ink-soft);margin-top:3px;">相手の発言:「'+esc(f.evidence)+'」</div>'; }
        if(f.drill){ h += '<div style="font-size:13px;margin-top:6px;line-height:1.6;"><span style="font-weight:700;">→ 確認電話で:</span> '+esc(f.drill)+'</div>'; }
        h += '</div>';
      }
    }
    h += '</div>';
  }

  h += secTitle("総評");
  h += '<div class="summary-card">';
  var nn = r.needs_neck || {};
  if(nn.needs || nn.neck){
    h += '<div class="nn-row">';
    if(nn.needs){ h += '<div><span class="nn-label" style="color:var(--done);">ニーズ</span><div class="nn-val">'+esc(nn.needs)+'</div></div>'; }
    if(nn.neck){ h += '<div><span class="nn-label" style="color:var(--reinforce);">ネック</span><div class="nn-val">'+esc(nn.neck)+'</div></div>'; }
    h += '</div>';
  }
  if(nn.judgment){ h += '<div class="judgment">'+esc(nn.judgment)+'</div>'; }
  if(r.top_priority){ h += '<div class="priority"><div class="p-label">確認電話で最優先に潰す1点</div><div class="p-val">'+esc(r.top_priority)+'</div></div>'; }
  if(r.summary){ h += '<p class="summary-text">'+esc(r.summary)+'</p>'; }
  h += '</div>';

  $("result").innerHTML = h;
}
</script>
</body>
</html>`;

export default async function handler(req, res) {
  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(HTML);
  }
  if (req.method === "POST") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "APIキーが設定されていません" });
    try {
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(req.body),
      });
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    } catch (e) {
      return res.status(500).json({ error: "中継に失敗しました" });
    }
  }
  return res.status(405).json({ error: "method not allowed" });
}
