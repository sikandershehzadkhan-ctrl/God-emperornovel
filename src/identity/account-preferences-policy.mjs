const DEFAULTS = Object.freeze({site_theme:"light",reader_theme:"dark",font_size:18,line_height:1.85,text_width:600,reduced_motion:false,high_contrast:false,compact_cards:false});
const KEYS = new Set(Object.keys(DEFAULTS));
const READER_THEMES = new Set(["light","dark","midnight","sepia","imperial","cosmic"]);
export function defaultAccountPreferences() { return { ...DEFAULTS }; }
export function validateAccountPreferences(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok:false,error:"A preferences object is required." };
  if (Object.keys(input).some(key => !KEYS.has(key))) return { ok:false,error:"One or more preference fields are not supported." };
  const value = { ...DEFAULTS, ...input };
  if (!["light","dark"].includes(value.site_theme)) return { ok:false,error:"Choose a supported site theme." };
  if (!READER_THEMES.has(value.reader_theme)) return { ok:false,error:"Choose a supported reader theme." };
  if (!Number.isInteger(value.font_size) || value.font_size < 15 || value.font_size > 30) return { ok:false,error:"Reader text size must be between 15 and 30." };
  if (![1.65,1.85,2].includes(value.line_height)) return { ok:false,error:"Choose a supported line spacing." };
  if (![500,600,680].includes(value.text_width)) return { ok:false,error:"Choose a supported reading width." };
  for (const key of ["reduced_motion","high_contrast","compact_cards"]) if (typeof value[key] !== "boolean") return { ok:false,error:"Accessibility preferences must be true or false." };
  return { ok:true,value };
}
