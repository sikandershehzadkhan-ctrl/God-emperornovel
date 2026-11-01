/* Imperial Novel canonical page registry.
 * Access metadata is descriptive only. The Worker must enforce every permission.
 */
(function(root){
  'use strict';
  const routes=[
    ['home','/','public','site','Home'],
    ['discover','/discover','public','catalog','Discover'],
    ['catalog-legacy','/catalog','public','catalog','Discover'],
    ['trending','/trending','public','catalog','Trending'],
    ['rankings','/rankings','public','catalog','Rankings'],
    ['leaderboard-legacy','/leaderboard','public','catalog','Leaderboard'],
    ['for-you','/for-you','authenticated','user','For You'],
    ['search','/search','public','catalog','Search'],
    ['genres','/genres','public','catalog','Genres'],
    ['tags','/tags','public','catalog','Tags'],
    ['novel-detail','/novel/:novelId','public','catalog','Novel'],
    ['novel-chapters','/novel/:novelId/chapters','public','catalog','Chapters'],
    ['chapter-reader','/read/:novelId/:chapterId','public','catalog','Reader'],
    ['library','/library','owner','user','Library'],
    ['reading-history','/history','owner','user','Reading history'],
    ['following','/following','owner','user','Following'],
    ['notifications','/notifications','owner','user','Notifications'],
    ['community','/community','public','community','Community'],
    ['messages','/messages','owner','user','Messages'],
    ['account','/account','owner','user','Account'],
    ['account-settings','/account/settings','owner','user','Account settings'],
    ['login','/login','public','identity','Sign in'],
    ['register','/register','public','identity','Create account'],
    ['author-studio','/author','role:author','author','Author Studio'],
    ['author-profile','/author/:slug','public','catalog','Author profile'],
    ['author-novel-create','/author/novels/new','role:author','author','Create novel'],
    ['author-novel-edit','/author/novels/:novelId/edit','resource-owner','author','Edit novel'],
    ['tickets','/tickets','owner','commerce','Tickets'],
    ['omniportal','/omniportal','public','omni','OmniPortal'],
    ['trend-factory','/trend-factory','public','discovery','Trend Factory'],
    ['admin','/admin','permission:admin.dashboard','admin','Administration'],
    ['admin-security','/admin/security','permission:security.read','admin','Security'],
    ['privacy','/privacy','public','legal','Privacy'],
    ['terms','/terms','public','legal','Terms'],
    ['copyright','/copyright','public','legal','Rights and copyright']
  ].map(([id,path,access,scope,title])=>Object.freeze({id,path,access,scope,title,canonical:path}));
  const compiled=routes.map(route=>({route,segments:route.path.split('/').filter(Boolean),staticCount:route.path.split('/').filter(x=>x&&!x.startsWith(':')).length}));
  function normalizePath(pathname){
    let path=String(pathname||'/').split(/[?#]/,1)[0]||'/';
    if(!path.startsWith('/'))path='/'+path;
    path=path.replace(/\\/g,'/');
    if(path.length>1)path=path.replace(/\/+$/,'');
    return path;
  }
  function resolve(pathname){
    const path=normalizePath(pathname);
    const actual=path.split('/').filter(Boolean);
    const matches=[];
    for(const item of compiled){
      if(item.segments.length!==actual.length)continue;
      const params={};let ok=true;
      for(let i=0;i<actual.length;i++){
        const expected=item.segments[i],value=actual[i];
        if(expected.startsWith(':')){
          try{params[expected.slice(1)]=decodeURIComponent(value)}catch{ok=false;break}
          if(!params[expected.slice(1)]||params[expected.slice(1)].includes('/')){ok=false;break}
        }else if(expected!==value){ok=false;break}
      }
      if(ok)matches.push({route:item.route,params,staticCount:item.staticCount});
    }
    matches.sort((a,b)=>b.staticCount-a.staticCount);
    if(!matches.length)return null;
    const {route,params}=matches[0];
    return Object.freeze({...route,params:Object.freeze(params),requestedPath:path});
  }
  const api=Object.freeze({routes:Object.freeze(routes),normalizePath,resolve});
  root.ImperialNovelRoutes=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
