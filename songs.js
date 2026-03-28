const songs = [
  {
    title: "星降る海",
    artist: "Aqu3ra",
    file: "songs/星降る海.mp3",
    lyrics: [
      { start: 0.9, end: 3.2, text: "幾千の" },
      { start: 3.4, end: 6.8, text: "時を巡って今" },
      { start: 7.0, end: 9.5, text: "僕ら出会えたの" },
      { start: 9.8, end: 11.0, text: "ほら" },
      { start: 11.2, end: 14.7, text: "見失わないように" },
      { start: 15.3, end: 21.5, text: "手を離さないで", effect:["drift", "blur"],
       overlays: [{ type: "sparkle", at: 15.5,},{ type: "sparkle", at: 19.5,}]},
      { start: 38.6, end: 42.2, text: "ねぇ耳を澄ませて" },
      { start: 42.9, end: 47.6, text: "星の降る音が聞こえるでしょう？" },
      { start: 47.0, end: 51.2, text: "もっと近くに来て" },
      { start: 52.2, end: 54.1, text: "誰も知らない" },
      { start: 54.1, end: 57.2, text: "世界が待っているの" },
      { start: 57.4, end: 61.2, text: "手を取って踊りましょう" },
      { start: 62.0, end: 65.5, text: "はじまりの合図鳴らせば" },
      { start: 65.9, end: 66.3, text: "唄おう" },
      { start: 66.4, end: 66.9, text: "la", effect: "pop"  },
      { start: 66.9, end: 67.4, text: "la-" , effect: "pop" },
      { start: 67.4, end: 68.0, text: "la-!!" , effect: "pop" },
      { start: 68.2, end: 68.8, text: "響け" },
      { start: 68.8, end: 69.5, text: "la", effect: "pop"  },
      { start: 69.5, end: 70.0, text: "la-" , effect: "pop" },
      { start: 70.0, end: 71.7, text: "la-!!" , effect: "pop" },
      { start: 71.2, end: 73.6, text: "暗がりの道も" },
      { start: 73.6, end: 78.6, text: "月明かりが照らすの",
       overlays: [{ type: "flash", at: 77.60,duration: 2000,count: 20,spread: 220,x: 50,y: 46}]},
      { start: 80.2, end: 81.4, text: "宙、" },
      { start: 81.6, end: 84.6, text: "海の向こう" },
      { start: 84.8, end: 87.8, text: "きみのもとまで" },
      { start: 88.0, end: 89.1, text: "響くように" },
      { start: 89.3, end: 90.4, text: "歌えるかな" },
      { start: 91.0, end: 93.6, text: "どんな時も" },
      { start: 93.8, end: 96.8, text: "ここで待ってるよ" },
      { start: 97.0, end: 101.3, text: "祈っているからさ" },      
      { start: 102.1, end: 102.9, text: "ほら" },
      { start: 103.0, end: 106.7, text: "きらきら輝く星は" },
      { start: 106.9, end: 108.6, text: "色褪せず" },
      { start: 108.8, end: 110.0, text: "太古から" },
      { start: 110.2, end: 113.6, text: "照らし続けてる" },
      { start: 71.2, end: 73.6, text: "きみと辿り着けるさ" },
      { start: 71.2, end: 73.6, text: "心には" },
      { start: 71.2, end: 73.6, text: "会いたい誰かがいて" },
      { start: 71.2, end: 73.6, text: "羅針盤みたいね" },
      { start: 71.2, end: 73.6, text: "そっと" },
      { start: 71.2, end: 73.6, text: "目を開けてみて" },
      { start: 71.2, end: 73.6, text: "見えるものだけが" },      
      { start: 71.2, end: 73.6, text: "現実じゃないの" },
      { start: 71.2, end: 73.6, text: "きみといる世界は" },
      { start: 71.2, end: 73.6, text: "永遠の記憶に" },
      { start: 71.2, end: 73.6, text: "眠るのさ" },
      { start: 65.9, end: 66.3, text: "唄おう" },
      { start: 66.4, end: 66.9, text: "la", effect: "pop"  },
      { start: 66.9, end: 67.4, text: "la-" , effect: "pop" },
      { start: 67.4, end: 68.0, text: "la-!!" , effect: "pop" },
      { start: 68.2, end: 68.8, text: "響け" },
      { start: 68.8, end: 69.5, text: "la", effect: "pop"  },
      { start: 69.5, end: 70.0, text: "la-" , effect: "pop" },
      { start: 70.0, end: 71.7, text: "la-!!" , effect: "pop" },
      { start: 71.2, end: 73.6, text: "潮の満ち引きが" },
      { start: 73.6, end: 78.6, text: "導いてくれるの",
    ]
  },
  {
    title: "Parasite",
    artist: "DECO*27",
    file: "songs/parasite.mp3",
    lyrics: [
      { start: 1.0, end: 4.0, text: "text" },
      { start: 4.2, end: 7.5, text: "text" },
      { start: 8.0, end: 12.0, text: "text" }
    ]
  },
  {
    title: "愛言葉Ⅴ",
    artist: "DECO*27",
    file: "songs/aikotoba5.mp3",
    lyrics: [
      { start: 0.8, end: 3.6, text: "text" },
      { start: 4.0, end: 6.5, text: "text" },
      { start: 7.0, end: 10.5, text: "text" }
    ]
  },
  {
  title: "New Me",
  artist: "YOASOBI",
  file: "songs/NewMe.mp3",
  lyrics: [
    { start: 0.5, end: 3.0, text: "text" },
    { start: 3.2, end: 6.2, text: "text" },
    { start: 6.5, end: 9.8, text: "text" }
  ]
},
   {
  title: "可愛いあの子が気にゐらない",
  artist: "なるみや",
  file: "songs/Kawaiianokogakiniiranai.mp3",
  lyrics: [
    { start: 0.5, end: 3.0, text: "text" },
    { start: 3.2, end: 6.2, text: "text" },
    { start: 6.5, end: 9.8, text: "text" }
  ]
},
];
