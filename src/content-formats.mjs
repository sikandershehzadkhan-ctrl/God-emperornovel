// Canonical server-side content format registry. Capability labels must remain truthful.
export const CONTENT_FORMATS=[
 {id:"original",label:"Original novels",group:"text",originHint:"Global · original fiction",experience:"Text reader"},
 {id:"fanfiction",label:"Fanfiction",group:"text",originHint:"Global · fandom stories",experience:"Text reader"},
 {id:"light_novel",label:"Light novels",group:"text",originHint:"Japan-associated format tradition",experience:"Text reader"},
 {id:"web_novel",label:"Web novels",group:"text",originHint:"Global · serialized fiction",experience:"Text reader"},
 {id:"manga",label:"Manga",group:"comics",originHint:"Japan-associated comics tradition",experience:"Panel reader"},
 {id:"manhwa",label:"Manhwa",group:"comics",originHint:"Korea-associated comics tradition",experience:"Vertical or page reader"},
 {id:"manhua",label:"Manhua",group:"comics",originHint:"China-associated comics tradition",experience:"Panel reader"},
 {id:"webtoon",label:"Webtoons",group:"comics",originHint:"Digital-first · often vertical-scroll",experience:"Vertical-scroll reader"},
 {id:"comic",label:"Comics",group:"comics",originHint:"Global comics tradition",experience:"Panel reader"},
 {id:"graphic_novel",label:"Graphic novels",group:"comics",originHint:"Global illustrated storytelling",experience:"Panel reader"},
 {id:"anime",label:"Anime",group:"screen",originHint:"Japan-associated animation tradition",experience:"Catalog only · playback not enabled"},
 {id:"cartoon",label:"Cartoons",group:"screen",originHint:"Global animation category",experience:"Catalog only · playback not enabled"},
 {id:"audiobook",label:"Audiobooks",group:"audio",originHint:"Global audio storytelling",experience:"Catalog only · audio playback not enabled"},
 {id:"drama",label:"Drama adaptations",group:"screen",originHint:"Global screen adaptations",experience:"Catalog only · playback not enabled"},
 {id:"game",label:"Games",group:"interactive",originHint:"Global interactive media",experience:"Catalog only · game integration not enabled"}
];
export const CONTENT_FORMAT_IDS=new Set(CONTENT_FORMATS.map(x=>x.id));
