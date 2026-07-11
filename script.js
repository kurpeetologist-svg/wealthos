
'use strict';

const STORAGE_KEY='wealthos-v0.9.1-data';
const LEGACY_KEYS=['wealthos-v0.9-data','wealthos-v0.8-data','wealthos-v0.7-data','wealthos-v0.6-data'];
const nowMonth=new Date().toISOString().slice(0,7);
const $=id=>document.getElementById(id);

const currencies=['AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD','CAD','CDF','CHF','CLP','CNY','COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD','GNF','GTQ','GYD','HKD','HNL','HRK','HTG','HUF','IDR','ILS','INR','IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD','MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SOS','SRD','SSP','STN','SYP','SZL','THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS','UAH','UGX','USD','UYU','UZS','VES','VND','VUV','WST','XAF','XCD','XOF','XPF','YER','ZAR','ZMW','ZWL'];

const blankData=()=>({
  onboardingComplete:false,
  profile:{name:'',currency:'USD'},
  income:{source:'Total income',currentMonth:nowMonth,current:null},
  incomeHistory:[],
  taxes:{dueDate:'',estimate:0,reserved:0},
  emergency:{balance:0,essentials:0,targetMonths:6,monthlyContribution:0},
  challenge:{enabled:false,name:'',target:0,saved:0,startDate:'',durationWeeks:12,frequency:'weekly'},
  spending:{daily:0,weekly:0,monthly:0}
});

function n(v,f=0){const x=Number(v);return Number.isFinite(x)?x:f}
function saveData(d){localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}
function hasMeaningfulData(d){return d?.onboardingComplete||n(d?.income?.current)>0||(d?.incomeHistory||[]).length>0}
function migrate(raw){
  if(!raw||typeof raw!=='object')return blankData();
  const d=blankData();
  d.onboardingComplete=Boolean(raw.onboardingComplete??hasMeaningfulData(raw));
  d.profile.name=String(raw.profile?.name||'');
  d.profile.currency=currencies.includes(raw.profile?.currency)?raw.profile.currency:'USD';
  const inc=raw.income||raw.consulting||{};
  d.income.source=String(inc.source||inc.sourceName||'Total income');
  d.income.currentMonth=inc.currentMonth||nowMonth;
  d.income.current=inc.current!==undefined?n(inc.current):inc.currentMonth!==undefined?n(inc.currentMonth):null;
  d.incomeHistory=Array.isArray(raw.incomeHistory)?raw.incomeHistory.filter(x=>x?.month).map(x=>({month:x.month,amount:n(x.amount)})):[];
  if(!d.incomeHistory.length&&inc.previous!==undefined){
    const prev=new Date(`${d.income.currentMonth}-01T00:00:00`);prev.setMonth(prev.getMonth()-1);
    d.incomeHistory=[{month:prev.toISOString().slice(0,7),amount:n(inc.previous)}];
  }
  d.taxes={dueDate:String(raw.taxes?.dueDate||''),estimate:n(raw.taxes?.estimate),reserved:n(raw.taxes?.reserved)};
  d.emergency={balance:n(raw.emergency?.balance),essentials:n(raw.emergency?.essentials),targetMonths:Math.max(1,n(raw.emergency?.targetMonths,6)),monthlyContribution:n(raw.emergency?.monthlyContribution)};
  d.challenge={enabled:Boolean(raw.challenge?.enabled),name:String(raw.challenge?.name||''),target:n(raw.challenge?.target),saved:n(raw.challenge?.saved),startDate:String(raw.challenge?.startDate||''),durationWeeks:Math.max(1,n(raw.challenge?.durationWeeks,12)),frequency:['weekly','biweekly','monthly'].includes(raw.challenge?.frequency)?raw.challenge.frequency:'weekly'};
  d.spending={daily:Math.max(0,n(raw.spending?.daily)),weekly:Math.max(0,n(raw.spending?.weekly)),monthly:Math.max(0,n(raw.spending?.monthly))};
  return d;
}
function loadData(){
  for(const key of [STORAGE_KEY,...LEGACY_KEYS]){
    try{
      const raw=localStorage.getItem(key);
      if(raw){
        const data=migrate(JSON.parse(raw));
        if(key!==STORAGE_KEY)saveData(data);
        return data;
      }
    }catch(e){console.warn('Skipped unreadable saved data',key,e)}
  }
  return blankData();
}
function money(code){try{return new Intl.NumberFormat(undefined,{style:'currency',currency:code,maximumFractionDigits:0})}catch{return new Intl.NumberFormat(undefined,{maximumFractionDigits:0})}}
function formatMonth(m){if(!m)return'';const [y,mo]=m.split('-').map(Number);return new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(new Date(y,mo-1,1))}
function formatDate(s){if(!s)return'No date set';return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(s+'T12:00:00'))}
function daysUntil(s){if(!s)return null;const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(s+'T00:00:00')-t)/86400000)}
function greeting(){
  const h=new Date().getHours();
  $('greeting').textContent=(h<12?'Good morning!':h<18?'Good afternoon!':'Good evening!');
  $('reflection').textContent="Let's see where you stand today.";
}
function fillCurrency(select,selected){select.innerHTML='';currencies.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;o.selected=c===selected;select.appendChild(o)})}
function sortedHistory(d){
  const map=new Map((d.incomeHistory||[]).map(x=>[x.month,n(x.amount)]));
  if(d.income.current!==null)map.set(d.income.currentMonth,n(d.income.current));
  return [...map.entries()].map(([month,amount])=>({month,amount})).sort((a,b)=>a.month.localeCompare(b.month));
}
function stats(h){
  const cur=h.at(-1)||{amount:0},prev=h.at(-2)||null,prior=h.slice(0,-1),high=prior.length?Math.max(...prior.map(x=>x.amount)):null;
  let streak=1;for(let i=h.length-1;i>0;i--){if(h[i].amount>h[i-1].amount)streak++;else break}
  return{cur,prev,isRecord:high!==null&&cur.amount>high,avg:h.length?h.reduce((s,x)=>s+x.amount,0)/h.length:0,streak}
}
function showState(isReturning){
  $('firstVisitLobby').hidden=isReturning;$('returningLobby').hidden=!isReturning;
  $('firstVisitFocus').hidden=isReturning;$('signalGrid').hidden=!isReturning;
  $('firstVisitTimeline').hidden=isReturning;$('timelineGroups').hidden=!isReturning;
  $('firstVisitSnapshot').hidden=isReturning;$('returningSnapshot').hidden=!isReturning;
  $('aboutTrigger').hidden=!isReturning;
  $('focusIntro').textContent=isReturning?'Four Signals to help you understand what matters today.':"We'll surface the four most important things to know after your first check-in.";
}
function render(data){
  greeting();
  const returning=hasMeaningfulData(data);
  showState(returning);
  if(!returning)return;
  const fmt=money(data.profile.currency),h=sortedHistory(data),s=stats(h),cur=n(s.cur.amount),prev=s.prev?n(s.prev.amount):null,delta=prev===null?null:cur-prev,pct=prev>0?delta/prev*100:null,source=data.income.source||'Income';
  $('financialState').textContent=delta===null||delta>=0?'Your financial life is moving in the right direction.':'Your financial life is steady, with room to rebuild momentum.';
  $('attentionState').textContent='Your Focus is ready.';
  $('todayDate').textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());

  $('growthValue').textContent=fmt.format(cur);
  $('growthTitle').textContent=s.isRecord?`${source} reached a new monthly high`:delta>0?`${source} increased this month`:delta<0?`${source} decreased this month`:`${source} held steady this month`;
  $('growthChange').textContent=pct===null?'Your first recorded month':`${delta>=0?'+':''}${pct.toFixed(0)}% vs last month`;
  $('growthPersonal').textContent=s.isRecord?`This is your strongest ${source.toLowerCase()} month since you started WealthOS.`:delta===null?'This is the first chapter in your Timeline.':`Your ${source.toLowerCase()} is ${fmt.format(Math.abs(delta))} ${delta>=0?'higher':'lower'} than last month.`;
  $('growthStoryChanged').textContent=s.prev?`${source} moved from ${fmt.format(prev)} to ${fmt.format(cur)}.`:`You recorded ${fmt.format(cur)} for ${formatMonth(data.income.currentMonth)}.`;
  $('growthStoryMatters').textContent=s.isRecord?'This establishes a new reference point for future progress.':`Your recorded monthly average is ${fmt.format(s.avg)}.`;
  $('growthStoryNext').textContent='Keep checking in so WealthOS can distinguish a pattern from a single month.';

  const td=daysUntil(data.taxes.dueDate),te=n(data.taxes.estimate),tr=n(data.taxes.reserved),short=Math.max(0,te-tr),funded=te>0&&tr>=te;
  $('attentionTitle').textContent=te===0?'Your tax reserve is ready when you are':funded?'Your quarterly tax payment is fully reserved':'Your quarterly tax reserve has room to grow';
  $('attentionValue').textContent=td===null?'Not set':td<0?`${Math.abs(td)} days late`:`${td} days`;
  $('attentionChange').textContent=te===0?'Add details in About You':funded?`${fmt.format(tr)} reserved`:`${fmt.format(short)} remaining`;
  $('attentionPersonal').textContent=te===0?'Add a tax estimate whenever this becomes relevant to you.':funded?'You have set aside the full estimated amount.':'Your reserve is still building.';
  $('attentionStoryChanged').textContent=te===0?'No tax estimate has been added yet.':`Your current estimate is ${fmt.format(te)}.`;
  $('attentionStoryMatters').textContent=funded?'The payment should not interrupt your normal cash flow.':'This can become part of your Focus when you are ready.';
  $('attentionStoryNext').textContent=funded?'Keep the reserve untouched until the payment clears.':'Update the estimate or reserve in About You.';

  const eb=n(data.emergency.balance),ess=n(data.emergency.essentials),tm=n(data.emergency.targetMonths,6),months=ess>0?eb/ess:0,target=ess*tm,remaining=Math.max(0,target-eb),complete=ess>0&&eb>=target;
  if(data.challenge.enabled&&n(data.challenge.target)>0){
    const saved=n(data.challenge.saved),targetC=n(data.challenge.target),rem=Math.max(0,targetC-saved),per=Math.min(100,Math.round(saved/targetC*100));
    $('progressTitle').textContent=rem===0?`Your ${data.challenge.name} challenge is complete`:`Your ${data.challenge.name} challenge is moving forward`;
    $('progressValue').textContent=fmt.format(saved);$('progressChange').textContent=`${per}% of ${fmt.format(targetC)} saved`;$('progressPersonal').textContent=rem===0?'You reached the full target you set for yourself.':`${fmt.format(rem)} remains.`;
  }else{
    $('progressTitle').textContent=complete?'Your emergency fund is complete':'Your emergency fund is still building';
    $('progressValue').textContent=fmt.format(eb);$('progressChange').textContent=ess>0?`${months.toFixed(1)} months covered`:'Add monthly essentials';$('progressPersonal').textContent=complete?`You reached your ${tm}-month target.`:ess>0?`${fmt.format(remaining)} remains before your target.`:'Add essential expenses in About You to calculate coverage.';
  }
  $('progressStoryChanged').textContent='This moment reflects the progress currently saved in WealthOS.';$('progressStoryMatters').textContent='Progress becomes easier to understand when it is remembered over time.';$('progressStoryNext').textContent='Keep your check-in current.';

  let next;
  if(te>0&&short>0&&td!==null&&td<=30)next={t:'Continue building your tax reserve',v:fmt.format(short),c:'Worth reviewing',p:'This is the clearest current priority.'};
  else if(ess>0&&!complete)next={t:'Continue building your emergency fund',v:fmt.format(Math.min(remaining,n(data.emergency.monthlyContribution)||remaining)),c:`${months.toFixed(1)} of ${tm} months covered`,p:'Your emergency fund remains a strong next foundation.'};
  else if(data.challenge.enabled&&n(data.challenge.target)>n(data.challenge.saved))next={t:`Continue your ${data.challenge.name} challenge`,v:fmt.format(n(data.challenge.target)-n(data.challenge.saved)),c:'Remaining goal',p:'Your next contribution keeps the challenge moving.'};
  else next={t:'No financial action is required today',v:'On track',c:'Review when something changes',p:'Your current information does not require an immediate step.'};
  $('nextTitle').textContent=next.t;$('nextValue').textContent=next.v;$('nextChange').textContent=next.c;$('nextPersonal').textContent=next.p;$('nextStoryWhy').textContent=next.p;$('nextStoryChanges').textContent='This recommendation is based only on the information you chose to add.';$('nextStoryMove').textContent='Update About You whenever your priorities change.';
  renderTimeline(data,h,fmt,source);
  renderSnapshot(data,fmt,'weekly');
  populateAbout(data);
}
function timelineEvent(title,description,amount){
  const a=document.createElement('article');a.className='timeline-event';
  const b=document.createElement('button');b.className='timeline-event-button';b.type='button';b.setAttribute('aria-expanded','false');
  const marker=document.createElement('span');marker.className='timeline-marker';
  const copy=document.createElement('div');copy.className='timeline-copy';copy.innerHTML=`<h4>${title}</h4><p>${description}</p><span class="story-tone">Reflection</span>`;
  const val=document.createElement('div');val.className='timeline-amount';val.textContent=amount;
  const action=document.createElement('span');action.className='timeline-event-action';action.innerHTML='<span>Read story</span><b>+</b>';
  b.append(marker,copy,val,action);
  const story=document.createElement('div');story.className='timeline-story';story.innerHTML=`<div class="timeline-story-inner"><div class="timeline-story-block"><span>What happened</span><p>${description}</p></div><div class="timeline-story-block"><span>Why it matters</span><p>This chapter becomes part of the context WealthOS uses to help you understand future changes.</p></div></div>`;
  a.append(b,story);b.onclick=()=>{const open=a.classList.toggle('open');b.setAttribute('aria-expanded',String(open))};return a;
}
function renderTimeline(data,h,fmt,source){
  const groups=$('timelineGroups');groups.innerHTML='';
  const rev=[...h].reverse();$('timelineSummary').textContent=`${rev.length} chapter${rev.length===1?'':'s'} remembered.`;
  rev.forEach((x,i)=>{
    const prev=h[h.findIndex(y=>y.month===x.month)-1],diff=prev?x.amount-prev.amount:null;
    const month=document.createElement('section');month.className='timeline-month';
    const heading=document.createElement('div');heading.className='timeline-month-heading';heading.innerHTML=`<h3>${formatMonth(x.month)}</h3><p>1 chapter</p>`;
    const events=document.createElement('div');events.className='timeline-events';
    const title=i===0&&stats(h).isRecord?`${source} reached a new monthly high`:diff===null?'Your first chapter began':diff>0?`${source} moved forward`:diff<0?`${source} softened`:`${source} remained steady`;
    const desc=diff===null?`You recorded your first ${source.toLowerCase()} check-in.`:`Your ${source.toLowerCase()} changed by ${fmt.format(Math.abs(diff))} from the prior month.`;
    events.append(timelineEvent(title,desc,fmt.format(x.amount)));month.append(heading,events);groups.append(month);
  });
}
function renderSnapshot(data,fmt,period){
  const labels={daily:'Today',weekly:'This week',monthly:'This month'};
  const values={daily:n(data.spending?.daily),weekly:n(data.spending?.weekly),monthly:n(data.spending?.monthly)};
  const amount=values[period]||0;
  const monthlyIncome=n(data.income?.current);
  let monthlyEquivalent=amount;
  if(period==='daily')monthlyEquivalent=amount*30;
  if(period==='weekly')monthlyEquivalent=amount*4.345;
  $('snapshotPeriod').textContent=labels[period];
  $('snapshotValue').textContent=fmt.format(amount);
  if(monthlyIncome>0){
    const percent=(period==='monthly'?amount:monthlyEquivalent)/monthlyIncome*100;
    $('snapshotContext').textContent=period==='monthly'
      ? `${percent.toFixed(0)}% of this month's income has been spent.`
      : `At this pace, spending equals about ${percent.toFixed(0)}% of monthly income.`;
  }else{
    $('snapshotContext').textContent='Add monthly income to place this spending in context.';
  }
  $('snapshotNote').textContent=amount===0
    ? 'Your Snapshot is ready for its first spending check-in. Add a simple total in About You whenever you are ready.'
    : 'This is a snapshot, not a judgment. As WealthOS remembers more check-ins, it will become better at showing what is typical for you.';
  document.querySelectorAll('.period-button').forEach(button=>button.classList.toggle('active',button.dataset.period===period));
}
function populateAbout(d){
  fillCurrency($('currencyInput'),d.profile.currency);$('nameInput').value=d.profile.name;$('incomeSourceName').value=d.income.source;$('incomeMonth').value=d.income.currentMonth;$('incomeCurrent').value=d.income.current??'';$('taxDueDate').value=d.taxes.dueDate;$('taxEstimate').value=d.taxes.estimate;$('taxReserved').value=d.taxes.reserved;$('emergencyBalance').value=d.emergency.balance;$('essentialExpenses').value=d.emergency.essentials||'';$('targetMonths').value=d.emergency.targetMonths;$('emergencyContribution').value=d.emergency.monthlyContribution;$('challengeEnabled').checked=d.challenge.enabled;$('challengeName').value=d.challenge.name;$('challengeTarget').value=d.challenge.target;$('challengeSaved').value=d.challenge.saved;$('challengeStart').value=d.challenge.startDate;$('challengeDuration').value=d.challenge.durationWeeks;$('challengeFrequency').value=d.challenge.frequency;$('spendingDaily').value=d.spending?.daily||'';$('spendingWeekly').value=d.spending?.weekly||'';$('spendingMonthly').value=d.spending?.monthly||'';toggleChallenge();renderHistoryManager(d);
}
function renderHistoryManager(d){
  const box=$('historyManagerList');box.innerHTML='';(d.incomeHistory||[]).sort((a,b)=>b.month.localeCompare(a.month)).forEach(x=>{const row=document.createElement('div');row.className='history-manager-row';row.innerHTML=`<span>${formatMonth(x.month)}</span><strong>${money(d.profile.currency).format(x.amount)}</strong><button class="delete-history" type="button">Remove</button>`;row.querySelector('button').onclick=()=>{const latest=loadData();latest.incomeHistory=latest.incomeHistory.filter(y=>y.month!==x.month);saveData(latest);render(latest)};box.append(row)});
}
function readAbout(){
  const d=loadData(),newMonth=$('incomeMonth').value||nowMonth;
  if(d.income.current!==null&&d.income.currentMonth!==newMonth)d.incomeHistory.push({month:d.income.currentMonth,amount:n(d.income.current)});
  d.onboardingComplete=true;d.profile={name:$('nameInput').value.trim(),currency:$('currencyInput').value};d.income={source:$('incomeSourceName').value.trim()||'Income',currentMonth:newMonth,current:n($('incomeCurrent').value)};d.taxes={dueDate:$('taxDueDate').value,estimate:n($('taxEstimate').value),reserved:n($('taxReserved').value)};d.emergency={balance:n($('emergencyBalance').value),essentials:n($('essentialExpenses').value),targetMonths:n($('targetMonths').value,6),monthlyContribution:n($('emergencyContribution').value)};d.challenge={enabled:$('challengeEnabled').checked,name:$('challengeName').value.trim(),target:n($('challengeTarget').value),saved:n($('challengeSaved').value),startDate:$('challengeStart').value,durationWeeks:n($('challengeDuration').value,12),frequency:$('challengeFrequency').value};d.spending={daily:Math.max(0,n($('spendingDaily').value)),weekly:Math.max(0,n($('spendingWeekly').value)),monthly:Math.max(0,n($('spendingMonthly').value))};return d;
}
function toggleChallenge(){const on=$('challengeEnabled').checked;$('challengeFields').style.opacity=on?'1':'.45';$('challengeFields').querySelectorAll('input,select').forEach(x=>x.disabled=!on)}
function openOnboarding(){$('onboarding').classList.add('open');$('onboarding').setAttribute('aria-hidden','false');showStep(1)}
function closeOnboarding(){$('onboarding').classList.remove('open');$('onboarding').setAttribute('aria-hidden','true')}
function showStep(step){document.querySelectorAll('.onboarding-step').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===step));$('onboarding').dataset.current=step}
document.querySelectorAll('.onboarding-next').forEach(b=>b.onclick=()=>showStep(Math.min(5,n($('onboarding').dataset.current,1)+1)));
document.querySelectorAll('.onboarding-back').forEach(b=>b.onclick=()=>showStep(Math.max(1,n($('onboarding').dataset.current,1)-1)));
document.querySelectorAll('[data-begin-story]').forEach(b=>b.onclick=openOnboarding);$('beginStoryButton').onclick=openOnboarding;$('closeOnboarding').onclick=closeOnboarding;
document.querySelectorAll('input[name="challengeChoice"]').forEach(r=>r.onchange=()=>$('onboardingChallengeFields').hidden=document.querySelector('input[name="challengeChoice"]:checked').value!=='yes');
fillCurrency($('onboardingCurrency'),'USD');$('onboardingIncomeMonth').value=nowMonth;
$('onboardingForm').onsubmit=e=>{
  e.preventDefault();const d=blankData();d.onboardingComplete=true;d.profile={name:$('onboardingName').value.trim(),currency:$('onboardingCurrency').value};d.income={source:$('onboardingIncomeSource').value.trim()||'Total income',currentMonth:$('onboardingIncomeMonth').value||nowMonth,current:n($('onboardingIncomeAmount').value)};const yes=document.querySelector('input[name="challengeChoice"]:checked').value==='yes';d.challenge.enabled=yes;if(yes){d.challenge.name=$('onboardingChallengeName').value.trim()||'Savings';d.challenge.target=n($('onboardingChallengeTarget').value);d.challenge.startDate=new Date().toISOString().slice(0,10)}saveData(d);closeOnboarding();render(d);location.hash='focus';
};
$('aboutTrigger').onclick=()=>{$('aboutPanel').classList.add('open');$('panelBackdrop').hidden=false};$('closePanel').onclick=()=>{$('aboutPanel').classList.remove('open');$('panelBackdrop').hidden=true};$('panelBackdrop').onclick=$('closePanel').onclick;
$('challengeEnabled').onchange=toggleChallenge;$('aboutForm').onsubmit=e=>{e.preventDefault();const d=readAbout();saveData(d);render(d);$('closePanel').click()};
$('clearPreviewButton').onclick=()=>{if(confirm('Start fresh on this browser? This removes the saved Private Preview data.')){localStorage.removeItem(STORAGE_KEY);for(const k of LEGACY_KEYS)localStorage.removeItem(k);$('closePanel').click();render(blankData());location.hash='lobby'}};
document.querySelectorAll('.signal-button').forEach(b=>b.onclick=()=>{const card=b.closest('.signal-card'),open=card.classList.toggle('open');b.setAttribute('aria-expanded',String(open))});
document.querySelectorAll('.period-button').forEach(button=>button.addEventListener('click',()=>{const data=loadData();renderSnapshot(data,money(data.profile.currency),button.dataset.period)}));
render(loadData());
