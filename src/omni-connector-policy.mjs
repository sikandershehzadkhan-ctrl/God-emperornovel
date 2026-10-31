function numericFlag(value){return value===true||Number(value)===1}
export function normalizeConnectorBaseUrl(value){
  try{
    const url=new URL(String(value||"").trim());
    if(url.protocol!=="https:"||url.username||url.password||url.port||url.pathname!=="/"||url.search||url.hash)return "";
    return url.origin.toLowerCase();
  }catch{return ""}
}
function connectorScore(row){
  const authorized=String(row?.rights_status||"").toLowerCase()==="authorized";
  const enabled=numericFlag(row?.enabled);
  const searchable=Boolean(String(row?.search_url||"").trim());
  const evidence=Boolean(String(row?.rights_evidence_url||"").trim()||String(row?.terms_url||"").trim());
  const metadata=numericFlag(row?.metadata_import_allowed);
  const online=String(row?.last_status||"").toLowerCase()==="online";
  return (enabled&&authorized?100:0)+(authorized?20:0)+(searchable?10:0)+(evidence?5:0)+(metadata?3:0)+(online?2:0)+(row?.last_checked_at?1:0);
}
export function deduplicateConnectorRows(rows){
  const selected=new Map();
  for(const row of Array.isArray(rows)?rows:[]){
    const key=normalizeConnectorBaseUrl(row?.base_url);
    if(!key)continue;
    const current=selected.get(key);
    if(!current||connectorScore(row)>connectorScore(current)||(connectorScore(row)===connectorScore(current)&&Number(row.id||0)<Number(current.id||0)))selected.set(key,row);
  }
  return [...selected.values()].sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
}
export function summarizeConnectorRows(rows){
  const sources=deduplicateConnectorRows(rows);
  const authorized=sources.filter(row=>String(row.rights_status||"").toLowerCase()==="authorized");
  const searchReady=sources.filter(row=>numericFlag(row.enabled)&&String(row.rights_status||"").toLowerCase()==="authorized"&&(typeof row.search_ready==="boolean"?row.search_ready:Boolean(String(row.search_url||"").trim())));
  const online=searchReady.filter(row=>String(row.last_status||"").toLowerCase()==="online");
  return {registered:sources.length,authorized:authorized.length,enabled:sources.filter(row=>numericFlag(row.enabled)).length,search_ready:searchReady.length,online:online.length};
}
export function canImportConnectorMetadata(row){
  return Boolean(row&&numericFlag(row.enabled)&&String(row.rights_status||"").toLowerCase()==="authorized"&&numericFlag(row.metadata_import_allowed));
}
